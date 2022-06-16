package provider

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	provider_sdk_go "github.com/anzuhq/sdk/provider-sdk-go"
	"github.com/anzuhq/sdk/provider-sdk-go/protobuf"
	"github.com/anzuhq/sdk/value-sdk-go"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

type ProviderVersionBinary struct {
	URL      string `json:"url"`
	CheckSum string `json:"checkSum"`
}

type ProviderExecutionSettings struct {
	Binary ProviderVersionBinary `json:"binary"`
}

type deploymentProviderClient struct {
	providerId             string
	providerVersionId      string
	environmentProviderIds []string
	executionSettings      ProviderExecutionSettings

	client protobuf.ProviderClient
	conn   *grpc.ClientConn
}

type Client struct {
	ProviderId            string
	ProviderVersionId     string
	EnvironmentProviderId string
	protobuf.ProviderClient
}

type Clients map[string]deploymentProviderClient

func (c Clients) Get(environmentProviderId string) (*Client, error) {
	if c == nil {
		return nil, fmt.Errorf("deploymentProviderClients is nil")
	}

	if environmentProviderId == "" {
		return nil, fmt.Errorf("environmentProviderId is empty")
	}

	for _, client := range c {
		for i, id := range client.environmentProviderIds {
			if id == environmentProviderId {
				return &Client{
					ProviderId:            client.providerId,
					ProviderVersionId:     client.providerVersionId,
					EnvironmentProviderId: client.environmentProviderIds[i],
					ProviderClient:        client.client,
				}, nil
			}
		}
	}

	return nil, fmt.Errorf("provider client for environment provider id %q not found", environmentProviderId)
}

func (c Clients) GetByVersionId(providerVersionId string) (*Client, error) {
	if c == nil {
		return nil, fmt.Errorf("deploymentProviderClients is nil")
	}

	if providerVersionId == "" {
		return nil, fmt.Errorf("providerVersionId is empty")
	}

	for _, client := range c {
		if client.providerVersionId == providerVersionId {
			return &Client{
				ProviderId:        client.providerId,
				ProviderVersionId: client.providerVersionId,
				ProviderClient:    client.client,
			}, nil
		}
	}

	return nil, fmt.Errorf("provider client for provider version id %q not found", providerVersionId)
}

func (c Clients) Shutdown(logger logrus.FieldLogger) {
	for providerVersionId, client := range c {
		err := client.conn.Close()
		if err != nil {
			logger.WithError(err).Errorf("failed to close connection for provider %s", providerVersionId)
		}
	}
}

type Provider struct {
	ProviderId        string                    `json:"providerId"`
	ProviderVersionId string                    `json:"providerVersionId"`
	ExecutionSettings ProviderExecutionSettings `json:"executionSettings"`
	Usages            []ProviderUsage           `json:"usages"`
}

type ProviderUsage struct {
	EnvironmentProviderId string        `json:"environmentProviderId"`
	Configuration         []value.Input `json:"configuration"`
}

type setupOptions struct {
	disableCache               bool
	localProviders             map[string]int
	configurationValueResolver value.ConfigurationValueResolver
	shellName                  string
	logLevel                   string
}

type Opt func(*setupOptions)

func WithDisableCache(disable bool) Opt {
	return func(o *setupOptions) {
		o.disableCache = disable
	}
}

func WithLocalProviders(localProviders map[string]int) Opt {
	return func(o *setupOptions) {
		o.localProviders = localProviders
	}
}

func WithConfigurationValueResolver(configurationValueResolver value.ConfigurationValueResolver) Opt {
	return func(o *setupOptions) {
		o.configurationValueResolver = configurationValueResolver
	}
}

func WithShellName(shellName string) Opt {
	return func(o *setupOptions) {
		o.shellName = shellName
	}
}

func WithProviderLogLevel(logLevel string) Opt {
	return func(o *setupOptions) {
		o.logLevel = logLevel
	}
}

func SetupProviders(ctx context.Context, logger logrus.FieldLogger, providers []Provider, opt ...Opt) (Clients, error) {
	options := setupOptions{
		shellName: "sh",
	}
	for _, o := range opt {
		o(&options)
	}

	hd, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get user home directory: %w", err)
	}

	providersDir := filepath.Join(hd, ".anzu", "providers")
	err = os.MkdirAll(providersDir, os.ModePerm)
	if err != nil {
		return nil, fmt.Errorf("failed to create anzu provider cache: %w", err)
	}

	logger.Debugln("Downloading providers")

	providerBinaryPaths := make(map[string]string)
	for _, provider := range providers {
		_, isLocal := options.localProviders[provider.ProviderVersionId]
		if isLocal {
			logger.Debugln(fmt.Sprintf("Using local provider %s", provider.ProviderVersionId))
			continue
		}

		providerBinaryToUse := provider.ExecutionSettings.Binary

		providerBinaryPath := filepath.Join(providersDir, fmt.Sprintf("%s_%s_%s", provider.ProviderVersionId, runtime.GOOS, runtime.GOARCH))

		// Check if file exists
		_, err := os.Stat(providerBinaryPath)
		if err != nil && !os.IsNotExist(err) {
			return nil, fmt.Errorf("failed to stat provider binary: %w", err)
		}

		entry := logger.WithFields(logrus.Fields{
			"provider":         provider.ProviderId,
			"provider_version": provider.ProviderVersionId,
			"local_binary":     providerBinaryPath,
			"url":              providerBinaryToUse.URL,
			"os":               runtime.GOOS,
			"arch":             runtime.GOARCH,
		})
		if options.disableCache || os.IsNotExist(err) {
			// Download provider
			entry.Traceln("Downloading provider binary")
			err := downloadFile(ctx, logger, providerBinaryPath, providerBinaryToUse.URL, providerBinaryToUse.CheckSum)
			if err != nil {
				return nil, fmt.Errorf("failed to download provider: %w", err)
			}
		} else {
			entry.Traceln("Using cached provider binary")
		}

		providerBinaryPaths[provider.ProviderVersionId] = providerBinaryPath
	}

	logger.Debugln("Launching providers")

	// Launch one provider binary per provider version
	providerClients := make(map[string]deploymentProviderClient)
	for _, provider := range providers {
		var pc protobuf.ProviderClient
		var conn *grpc.ClientConn

		localPort, isLocal := options.localProviders[provider.ProviderVersionId]
		if isLocal {
			pc, conn, err = connectToProvider(ctx, localPort)
			if err != nil {
				return nil, fmt.Errorf("failed to connect to local provider: %w", err)
			}
		} else {
			binaryPath := providerBinaryPaths[provider.ProviderVersionId]
			pc, conn, err = launchProvider(ctx, logger, provider, binaryPath, options.shellName, options.logLevel)
			if err != nil {
				return nil, fmt.Errorf("failed to launch provider: %w", err)
			}
		}

		err = configureProvider(ctx, pc, provider, options.configurationValueResolver)
		if err != nil {
			return nil, fmt.Errorf("failed to configure provider: %w", err)
		}

		environmentProviderIds := make([]string, len(provider.Usages))
		for i, usage := range provider.Usages {
			environmentProviderIds[i] = usage.EnvironmentProviderId
		}

		providerClients[provider.ProviderVersionId] = deploymentProviderClient{
			providerVersionId:      provider.ProviderVersionId,
			environmentProviderIds: environmentProviderIds,
			providerId:             provider.ProviderId,
			client:                 pc,
			conn:                   conn,
		}
	}

	return providerClients, nil
}

func downloadFile(ctx context.Context, logger logrus.FieldLogger, path string, url string, checkSum string) error {
	// Download binary into memory
	client := &http.Client{}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download file: %w", err)
	}

	tarballPath := fmt.Sprintf("%s.tar.gz", path)

	// Write to file
	file, err := os.Create(tarballPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}

	_, err = io.Copy(file, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	// Get SHA256 checksum of archive
	checksum := sha256.New()
	archiveFile, err := os.Open(tarballPath)
	if err != nil {
		return fmt.Errorf("could not open archive: %w", err)
	}

	_, err = io.Copy(checksum, archiveFile)
	if err != nil {
		return fmt.Errorf("could not calculate checksum: %w", err)
	}

	checksumBytes := checksum.Sum(nil)
	checkSumBase64 := base64.StdEncoding.EncodeToString(checksumBytes)

	if checkSumBase64 != checkSum {
		return fmt.Errorf("checksum mismatch")
	}

	// Unpack tarball
	err = untar(logger, tarballPath, path)
	if err != nil {
		return fmt.Errorf("failed to untar file: %w", err)
	}

	// Remove tarball
	err = os.RemoveAll(tarballPath)
	if err != nil {
		return fmt.Errorf("failed to remove tarball: %w", err)
	}

	return nil
}

func untar(logger logrus.FieldLogger, tarballPath string, path string) error {
	command := exec.Command("tar", "-xzf", tarballPath)
	command.Dir = filepath.Dir(path)
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	err := command.Run()
	if err != nil {
		return fmt.Errorf("failed to untar file: %w", err)
	}

	// Check if file exists
	_, err = os.Stat(path)
	if err != nil {
		return fmt.Errorf("could not check that provider exists: %w", err)
	}

	return nil
}

func launchProvider(ctx context.Context, logger logrus.FieldLogger, provider Provider, binaryPath, shellName, logLevel string) (protobuf.ProviderClient, *grpc.ClientConn, error) {
	port, err := freePort()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get free port: %w", err)
	}

	if logLevel == "" {
		logLevel = "warn"
	}

	command := exec.Command(shellName, "-c", binaryPath)
	
	command.Env = []string{
		fmt.Sprintf("PORT=%d", port),
		fmt.Sprintf("LOG_LEVEL=%s", logLevel),
	}

	passVariables := []string{"HOME", "PWD", "USER", "PATH"}
	for _, varName := range passVariables {
		if varValue := os.Getenv(varName); varValue != "" {
			command.Env = append(command.Env, fmt.Sprintf("%s=%s", varName, varValue))
		}
	}

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	err = command.Start()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to start provider: %w", err)
	}

	// Stop provider when context is canceled
	go func() {
		<-ctx.Done()
		_ = command.Process.Signal(syscall.SIGTERM)
		time.Sleep(5 * time.Second)
		_ = command.Process.Kill()
	}()

	time.Sleep(2 * time.Second)

	var providerClient protobuf.ProviderClient
	var conn *grpc.ClientConn

	// Wait until provider has started up
	i := 0
	for {
		if i == 5 {
			return nil, nil, fmt.Errorf("failed to connect to provider: %w", err)
		}

		time.Sleep(1 * time.Second)
		i++

		providerClient, conn, err = connectToProvider(ctx, port)
		if err != nil {
			continue
		}

		_, err = providerClient.Ping(ctx, &protobuf.PingRequest{})
		if err != nil {
			continue
		}

		break
	}

	return providerClient, conn, nil
}

func connectToProvider(ctx context.Context, port int) (protobuf.ProviderClient, *grpc.ClientConn, error) {
	conn, err := grpc.Dial(fmt.Sprintf("localhost:%d", port), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to provider: %w", err)
	}

	providerClient := protobuf.NewProviderClient(conn)

	return providerClient, conn, nil
}

func configureProvider(ctx context.Context, providerClient protobuf.ProviderClient, provider Provider, configurationValueResolver value.ConfigurationValueResolver) error {
	for _, usage := range provider.Usages {
		resolvedConfig := make([]value.Input, len(usage.Configuration))
		for i, configInput := range usage.Configuration {
			resolved, err := value.ResolveValue(ctx, configInput.Value, nil, configurationValueResolver, nil)
			if err != nil {
				return fmt.Errorf("failed to resolve configuration: %w", err)
			}
			resolvedConfig[i] = value.Input{
				Name:  configInput.Name,
				Value: resolved,
			}
		}

		configData := provider_sdk_go.ProviderConfigurationData{
			Values: resolvedConfig,
		}
		marshalledConfig, err := json.Marshal(configData)

		_, err = providerClient.Configure(ctx, &protobuf.ConfigureRequest{
			EnvironmentProviderId: usage.EnvironmentProviderId,
			ConfigValues:          string(marshalledConfig),
		})
		if err != nil {
			return fmt.Errorf("failed to configure provider: %w", err)
		}
	}

	return nil
}

// freePort asks the kernel for a free open port that is ready to use.
func freePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

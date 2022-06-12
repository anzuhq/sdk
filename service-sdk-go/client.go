package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type client struct {
	httpClient *http.Client

	serviceToken string
	apiHost      string
}

type OptFunc func(client *client)

func WithHttpClient(httpClient *http.Client) OptFunc {
	return func(client *client) {
		client.httpClient = httpClient
	}
}

func WithServiceToken(serviceToken string) OptFunc {
	return func(client *client) {
		client.serviceToken = serviceToken
	}
}

func WithApiHost(apiHost string) OptFunc {
	return func(client *client) {
		client.apiHost = apiHost
	}
}

func buildDefault() *client {
	client := &client{
		httpClient:   &http.Client{},
		apiHost:      "https://api.anzuhq.com",
		serviceToken: "",
	}

	getEnv := func(name string) string {
		return os.Getenv(fmt.Sprintf("ANZU_%s", name))
	}

	serviceTokenEnv := getEnv("SERVICE_TOKEN")
	if serviceTokenEnv != "" {
		client.serviceToken = serviceTokenEnv
	}

	apiHostEnv := getEnv("API_HOST")
	if apiHostEnv != "" {
		client.apiHost = apiHostEnv
	}

	return client
}

type Client interface {
	GetCurrentService(ctx context.Context) (*GetCurrentServiceResp, error)
	GetConnectionDetails(ctx context.Context, connectionId string) (*GetServiceConnectionResp, error)
}

func NewClient(opts ...OptFunc) (Client, error) {
	defaultClient := buildDefault()

	for _, opt := range opts {
		opt(defaultClient)
	}

	return defaultClient, nil
}

func (c *client) sendRequest(ctx context.Context, method string, path string, reqBody any, resBody any) error {
	var buf io.Reader
	if reqBody != nil {
		b, err := json.Marshal(reqBody)
		if err != nil {
			return err
		}
		buf = bytes.NewBuffer(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, fmt.Sprintf("%s%s", c.apiHost, path), buf)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.serviceToken))

	res, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("request failed: %s", res.Status)
	}

	if resBody != nil {
		err = json.NewDecoder(res.Body).Decode(resBody)
		if err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}

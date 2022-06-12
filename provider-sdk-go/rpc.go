package provider_sdk_go

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/anzuhq/sdk/provider-sdk-go/protobuf"
	"github.com/anzuhq/sdk/value-sdk-go"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"math/rand"
	"net"
	"time"
)

// This file provides the mapping between the generated gRPC methods and the supplied provider code.

type server struct {
	protobuf.UnimplementedProviderServer
	provider      *Provider
	configuration map[string]ProviderConfiguration
}

func (s *server) Configure(ctx context.Context, in *protobuf.ConfigureRequest) (*protobuf.ConfigureReply, error) {
	var configValue ProviderConfigurationData

	err := json.Unmarshal([]byte(in.ConfigValues), &configValue)
	if err != nil {
		return &protobuf.ConfigureReply{}, fmt.Errorf("failed to unmarshal config values: %w", err)
	}

	s.configuration[in.EnvironmentProviderId] = &configValue

	return &protobuf.ConfigureReply{}, nil
}

func (s *server) Create(ctx context.Context, in *protobuf.CreateRequest) (*protobuf.CreateReply, error) {
	resourceInfo := ResourceInfoProviderData{
		rand: rand.New(rand.NewSource(time.Now().UnixNano())),
	}

	err := json.Unmarshal([]byte(in.ResourceInfo), &resourceInfo)
	if err != nil {
		return &protobuf.CreateReply{}, fmt.Errorf("failed to unmarshal resource info: %w", err)
	}

	resource, ok := s.provider.Resources[resourceInfo.GetResourceKind()]
	if !ok {
		return &protobuf.CreateReply{}, fmt.Errorf("resource kind %q not found", resourceInfo.GetResourceKind())
	}

	var inputValues InputValueProviderData
	err = json.Unmarshal([]byte(in.InputValues), &inputValues)
	if err != nil {
		return &protobuf.CreateReply{}, fmt.Errorf("failed to unmarshal input value: %w", err)
	}

	environmentProviderConfig, ok := s.configuration[in.EnvironmentProviderId]
	if !ok {
		return &protobuf.CreateReply{}, fmt.Errorf("environment provider %q was not configured", in.EnvironmentProviderId)
	}

	var deployment DeploymentInfoProviderData
	err = json.Unmarshal([]byte(in.DeploymentInfo), &deployment)
	if err != nil {
		return &protobuf.CreateReply{}, fmt.Errorf("failed to unmarshal deployment info: %w", err)
	}

	// TODO Handle panics
	resp, err := resource.Create(ctx, &CreateRequest{
		Resource:   &resourceInfo,
		Inputs:     &inputValues,
		Deployment: &deployment,
	}, environmentProviderConfig)
	if err != nil {
		return &protobuf.CreateReply{}, fmt.Errorf("failed to create resource: %w", err)
	}

	outputValues := make([]value.Output, 0)
	if resp.Outputs != nil {
		outputValues, err = resp.Outputs.Get()
		if err != nil {
			return &protobuf.CreateReply{}, fmt.Errorf("failed to get output values: %w", err)
		}
	}

	marshaledOutputValues, err := json.Marshal(outputValues)
	if err != nil {
		return &protobuf.CreateReply{}, fmt.Errorf("failed to marshal output values: %w", err)
	}

	marshaledState, err := json.Marshal(resp.InitialState)
	if err != nil {
		return &protobuf.CreateReply{}, fmt.Errorf("failed to marshal initial state: %w", err)
	}

	return &protobuf.CreateReply{
		State:        string(marshaledState),
		OutputValues: string(marshaledOutputValues),
	}, nil
}

func (s *server) Read(ctx context.Context, in *protobuf.ReadRequest) (*protobuf.ReadReply, error) {
	resourceInfo := ResourceInfoProviderData{
		rand: rand.New(rand.NewSource(time.Now().UnixNano())),
	}

	err := json.Unmarshal([]byte(in.ResourceInfo), &resourceInfo)
	if err != nil {
		return &protobuf.ReadReply{}, fmt.Errorf("failed to unmarshal resource info: %w", err)
	}

	resource, ok := s.provider.Resources[resourceInfo.GetResourceKind()]
	if !ok {
		return &protobuf.ReadReply{}, fmt.Errorf("resource kind %q not found", resourceInfo.GetResourceKind())
	}

	var state StateProviderData
	err = json.Unmarshal([]byte(in.State), &state)
	if err != nil {
		return &protobuf.ReadReply{}, fmt.Errorf("failed to unmarshal input value: %w", err)
	}

	environmentProviderConfig, ok := s.configuration[in.EnvironmentProviderId]
	if !ok {
		return &protobuf.ReadReply{}, fmt.Errorf("environment provider %q was not configured", in.EnvironmentProviderId)
	}

	var deployment DeploymentInfoProviderData
	err = json.Unmarshal([]byte(in.DeploymentInfo), &deployment)
	if err != nil {
		return &protobuf.ReadReply{}, fmt.Errorf("failed to unmarshal deployment info: %w", err)
	}

	// TODO Handle panics
	resp, err := resource.Read(ctx, &ReadRequest{
		Resource:   &resourceInfo,
		State:      &state,
		Deployment: &deployment,
	}, environmentProviderConfig)

	marshaledState, err := json.Marshal(resp.NextState)
	if err != nil {
		return &protobuf.ReadReply{}, fmt.Errorf("failed to marshal next state: %w", err)
	}

	outputValues := make([]value.Output, 0)
	if resp.Outputs != nil {
		outputValues, err = resp.Outputs.Get()
		if err != nil {
			return &protobuf.ReadReply{}, fmt.Errorf("failed to get output values: %w", err)
		}
	}

	marshaledOutputValues, err := json.Marshal(outputValues)
	if err != nil {
		return &protobuf.ReadReply{}, fmt.Errorf("failed to marshal output values: %w", err)
	}

	return &protobuf.ReadReply{
		State:        string(marshaledState),
		OutputValues: string(marshaledOutputValues),
	}, nil
}

func (s *server) Update(ctx context.Context, in *protobuf.UpdateRequest) (*protobuf.UpdateReply, error) {
	resourceInfo := ResourceInfoProviderData{
		rand: rand.New(rand.NewSource(time.Now().UnixNano())),
	}

	err := json.Unmarshal([]byte(in.ResourceInfo), &resourceInfo)
	if err != nil {
		return &protobuf.UpdateReply{}, fmt.Errorf("failed to unmarshal resource info: %w", err)
	}

	resource, ok := s.provider.Resources[resourceInfo.GetResourceKind()]
	if !ok {
		return &protobuf.UpdateReply{}, fmt.Errorf("resource kind %q not found", resourceInfo.GetResourceKind())
	}

	var state StateProviderData
	err = json.Unmarshal([]byte(in.State), &state)
	if err != nil {
		return &protobuf.UpdateReply{}, fmt.Errorf("failed to unmarshal input value: %w", err)
	}

	var inputValues InputValueProviderData
	err = json.Unmarshal([]byte(in.InputValues), &inputValues)
	if err != nil {
		return &protobuf.UpdateReply{}, fmt.Errorf("failed to unmarshal input values: %w", err)
	}

	environmentProviderConfig, ok := s.configuration[in.EnvironmentProviderId]
	if !ok {
		return &protobuf.UpdateReply{}, fmt.Errorf("environment provider %q was not configured", in.EnvironmentProviderId)
	}

	var deployment DeploymentInfoProviderData
	err = json.Unmarshal([]byte(in.DeploymentInfo), &deployment)
	if err != nil {
		return &protobuf.UpdateReply{}, fmt.Errorf("failed to unmarshal deployment info: %w", err)
	}

	// TODO Handle panics
	resp, err := resource.Update(ctx, &UpdateRequest{
		Resource:   &resourceInfo,
		State:      &state,
		Inputs:     &inputValues,
		Deployment: &deployment,
	}, environmentProviderConfig)

	marshaledState, err := json.Marshal(resp.NextState)
	if err != nil {
		return &protobuf.UpdateReply{}, fmt.Errorf("failed to marshal next state: %w", err)
	}

	outputValues := make([]value.Output, 0)
	if resp.Outputs != nil {
		outputValues, err = resp.Outputs.Get()
		if err != nil {
			return &protobuf.UpdateReply{}, fmt.Errorf("failed to get output values: %w", err)
		}

	}

	marshaledOutputValues, err := json.Marshal(outputValues)
	if err != nil {
		return &protobuf.UpdateReply{}, fmt.Errorf("failed to marshal output values: %w", err)
	}

	return &protobuf.UpdateReply{
		State:        string(marshaledState),
		OutputValues: string(marshaledOutputValues),
	}, nil
}

func (s *server) Delete(ctx context.Context, in *protobuf.DeleteRequest) (*protobuf.DeleteReply, error) {
	resourceInfo := ResourceInfoProviderData{
		rand: rand.New(rand.NewSource(time.Now().UnixNano())),
	}

	err := json.Unmarshal([]byte(in.ResourceInfo), &resourceInfo)
	if err != nil {
		return &protobuf.DeleteReply{}, fmt.Errorf("failed to unmarshal resource info: %w", err)
	}

	resource, ok := s.provider.Resources[resourceInfo.GetResourceKind()]
	if !ok {
		return &protobuf.DeleteReply{}, fmt.Errorf("resource kind %q not found", resourceInfo.GetResourceKind())
	}

	var state StateProviderData
	err = json.Unmarshal([]byte(in.State), &state)
	if err != nil {
		return &protobuf.DeleteReply{}, fmt.Errorf("failed to unmarshal input value: %w", err)
	}

	environmentProviderConfig, ok := s.configuration[in.EnvironmentProviderId]
	if !ok {
		return &protobuf.DeleteReply{}, fmt.Errorf("environment provider %q was not configured", in.EnvironmentProviderId)
	}

	var deployment DeploymentInfoProviderData
	err = json.Unmarshal([]byte(in.DeploymentInfo), &deployment)
	if err != nil {
		return &protobuf.DeleteReply{}, fmt.Errorf("failed to unmarshal deployment info: %w", err)
	}

	// TODO Handle panics
	_, err = resource.Delete(ctx, &DeleteRequest{
		Resource:   &resourceInfo,
		State:      &state,
		Deployment: &deployment,
	}, environmentProviderConfig)

	return &protobuf.DeleteReply{}, nil
}

func (s *server) Ping(ctx context.Context, in *protobuf.PingRequest) (*protobuf.PingReply, error) {
	return &protobuf.PingReply{}, nil
}

func (s *server) InvokeFunction(ctx context.Context, in *protobuf.InvokeFunctionRequest) (*protobuf.InvokeFunctionReply, error) {
	function, ok := s.provider.Functions[in.FunctionName]
	if !ok {
		return &protobuf.InvokeFunctionReply{}, fmt.Errorf("function %q not found", in.FunctionName)
	}

	var argumentValues InputValueProviderData
	err := json.Unmarshal([]byte(in.ArgumentValues), &argumentValues)
	if err != nil {
		return &protobuf.InvokeFunctionReply{}, fmt.Errorf("failed to unmarshal input value: %w", err)
	}

	environmentProviderConfig, ok := s.configuration[in.EnvironmentProviderId]
	if !ok {
		return &protobuf.InvokeFunctionReply{}, fmt.Errorf("environment provider %q was not configured", in.EnvironmentProviderId)
	}

	output, err := function(ctx, environmentProviderConfig.Get(), argumentValues.Get())
	if err != nil {
		return &protobuf.InvokeFunctionReply{}, fmt.Errorf("failed to invoke function: %w", err)
	}

	if output == nil {
		return &protobuf.InvokeFunctionReply{}, nil
	}

	marshaledOutput, err := json.Marshal(output)
	if err != nil {
		return &protobuf.InvokeFunctionReply{}, fmt.Errorf("failed to marshal output: %w", err)
	}

	return &protobuf.InvokeFunctionReply{
		OutputValue: string(marshaledOutput),
	}, nil
}

func serve(ctx context.Context, logger *logrus.Entry, provider *Provider, port int) error {
	grpcServer := grpc.NewServer()
	providerServer := &server{
		provider:      provider,
		configuration: make(map[string]ProviderConfiguration),
	}

	protobuf.RegisterProviderServer(grpcServer, providerServer)

	logger.WithFields(logrus.Fields{
		"port": port,
	}).Traceln("starting provider server")

	lis, err := net.Listen("tcp", fmt.Sprintf("localhost:%d", port))
	if err != nil {
		return fmt.Errorf("failed to listen: %w", err)
	}

	logger.WithFields(logrus.Fields{
		"port": port,
	}).Traceln("starting to serve")

	go func() {
		<-ctx.Done()
		logger.Traceln("shutting down provider server")
		grpcServer.GracefulStop()
		logger.Traceln("shut down provider server")
	}()

	err = grpcServer.Serve(lis)
	if err != nil {
		return fmt.Errorf("failed to serve: %w", err)
	}

	logger.Traceln("stopped serving")

	return nil
}

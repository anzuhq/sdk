package provider_sdk_go

import (
	"context"
	"github.com/anzuhq/sdk/value-sdk-go"
)

type CreateRequest struct {
	Inputs     InputValueProvider
	Resource   ResourceInfoProvider
	Deployment DeploymentInfoProvider
}

type CreateResponse struct {
	InitialState State
	Outputs      value.OutputProvider
}

type ReadRequest struct {
	State      StateProvider
	Resource   ResourceInfoProvider
	Deployment DeploymentInfoProvider
}

type ReadResponse struct {
	NextState State
	Outputs   value.OutputProvider
}

type UpdateRequest struct {
	Inputs     InputValueProvider
	State      StateProvider
	Resource   ResourceInfoProvider
	Deployment DeploymentInfoProvider
}

type UpdateResponse struct {
	NextState State
	Outputs   value.OutputProvider
}

type DeleteRequest struct {
	State      StateProvider
	Resource   ResourceInfoProvider
	Deployment DeploymentInfoProvider
}

type DeleteResponse struct {
}

type ProviderResource interface {
	// Create creates a new resource given the resolved inputs.
	Create(ctx context.Context, request *CreateRequest, config ProviderConfiguration) (*CreateResponse, error)

	// Read is called during refresh operations to retrieve the current state of the resource.
	Read(ctx context.Context, request *ReadRequest, config ProviderConfiguration) (*ReadResponse, error)

	// Update is called to update an existing resource to the desired state.
	Update(ctx context.Context, request *UpdateRequest, config ProviderConfiguration) (*UpdateResponse, error)

	// Delete is called to delete an existing resource.
	Delete(ctx context.Context, request *DeleteRequest, config ProviderConfiguration) (*DeleteResponse, error)
}

type Provider struct {
	Resources map[string]ProviderResource
	Functions map[string]value.Function
}

package provider_sdk_go

import (
	"github.com/anzuhq/sdk/value-sdk-go"
	"math/rand"
)

// State is an arbitrary data structure that can be used to store resource state.
type State interface{}

type InputValueProvider interface {
	Get() []value.Input
}

type InputValueProviderData struct {
	Inputs []value.Input `json:"inputs"`
}

func (d *InputValueProviderData) Get() []value.Input {
	return d.Inputs
}

type StateProvider interface {
	Get() State
}

type StateProviderData struct {
	State State `json:"state"`
}

func (p *StateProviderData) Get() State {
	return p.State
}

type ResourceInfoProvider interface {
	GetResourceId() string

	// GetResourceName returns resource name suffixed with a random string to avoid name clashes across environments, separated by a hyphen (-).
	// The result of this method is only deterministic within the same plan step.
	// Uses GetResourceNameWithSeparator.
	GetResourceName() string

	// GetResourceNameWithSeparator behaves like GetResourceName but allows for a custom separator to be used.
	// Uses CollisionFreeNameWithSeparator.
	GetResourceNameWithSeparator(sep rune) string

	// GetRawResourceName returns the user-supplied name of the resource.
	// Warning: This is *not* unique across environments, and may lead to name clashes, using GetResourceName instead is highly recommended.
	GetRawResourceName() string

	GetResourceKind() string
}

type ResourceInfoProviderData struct {
	ResourceId   string `json:"resourceId"`
	ResourceName string `json:"resourceName"`
	ResourceKind string `json:"resourceKind"`

	rand *rand.Rand
}

func (p *ResourceInfoProviderData) GetResourceId() string {
	return p.ResourceId
}

func (p *ResourceInfoProviderData) GetResourceName() string {
	return p.GetResourceNameWithSeparator('-')
}

func (p *ResourceInfoProviderData) GetResourceNameWithSeparator(sep rune) string {
	return CollisionFreeNameWithSeparator(p.ResourceName, sep, p.rand)
}

func (p *ResourceInfoProviderData) GetRawResourceName() string {
	return p.ResourceName
}

func (p *ResourceInfoProviderData) GetResourceKind() string {
	return p.ResourceKind
}

type DeploymentInfoProvider interface {
	GetDeploymentId() string
	GetIdempotencyKey() string
	GetDeploymentProviderToken() string
}

type DeploymentInfoProviderData struct {
	DeploymentId string `json:"deploymentId"`

	IdempotencyKey string `json:"idempotencyKey"`

	DeploymentProviderToken string `json:"deploymentProviderToken"`
}

func (p *DeploymentInfoProviderData) GetDeploymentId() string {
	return p.DeploymentId
}

// GetIdempotencyKey returns a unique identifier for the deployment step associated to the request
// and can be used to deduplicate operations that should happen only once in case of a retry.
// This key is unique to the current step and deployment, a new deployment will generate new idempotency keys for every step.
func (p *DeploymentInfoProviderData) GetIdempotencyKey() string {
	return p.IdempotencyKey
}

// GetDeploymentProviderToken returns a temporary token that can be used to
// verify API requests are sent by the current deployment. Tokens expire after 3h after the deployment was started.
func (p *DeploymentInfoProviderData) GetDeploymentProviderToken() string {
	return p.DeploymentProviderToken
}

type ProviderConfiguration interface {
	Get() []value.Input
}

type ProviderConfigurationData struct {
	Values []value.Input `json:"values"`
}

func (p *ProviderConfigurationData) Get() []value.Input {
	return p.Values
}

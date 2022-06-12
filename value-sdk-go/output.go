package value

type OutputResolver interface {
	ResolveOutput(projectId string, environmentId string, resourceId string, outputName string) (Value, error)
}

type literalOutputResolver struct {
	fn func(ProjectId string, EnvironmentId string, ResourceId string, OutputName string) (Value, error)
}

func (r *literalOutputResolver) ResolveOutput(projectId string, environmentId string, resourceId string, outputName string) (Value, error) {
	return r.fn(projectId, environmentId, resourceId, outputName)
}

func NewOutputResolver(resolve func(projectId string, environmentId string, resourceId string, outputName string) (Value, error)) OutputResolver {
	return &literalOutputResolver{
		fn: resolve,
	}
}

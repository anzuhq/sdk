package value

type ConfigurationValueResolver interface {
	ResolveConfigurationValue(valueName string) (Value, error)
}

type literalConfigurationValueResolver struct {
	fn func(valueName string) (Value, error)
}

func (r *literalConfigurationValueResolver) ResolveConfigurationValue(valueName string) (Value, error) {
	return r.fn(valueName)
}

func NewConfigurationValueResolver(resolve func(valueName string) (Value, error)) ConfigurationValueResolver {
	return &literalConfigurationValueResolver{
		fn: resolve,
	}
}

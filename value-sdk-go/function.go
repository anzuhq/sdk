package value

import "context"

type Function func(ctx context.Context, config []Input, arguments []Input) (*Value, error)

type FunctionValueResolver interface {
	ResolveFunctionValue(ctx context.Context, providerId, functionName string, arguments []Input) (Value, error)
}

type literalFunctionResolver struct {
	fn func(ctx context.Context, providerId, functionName string, arguments []Input) (Value, error)
}

func (r *literalFunctionResolver) ResolveFunctionValue(ctx context.Context, providerId, functionName string, arguments []Input) (Value, error) {
	return r.fn(ctx, providerId, functionName, arguments)
}

func NewFunctionValueResolver(resolve func(ctx context.Context, providerId, functionName string, arguments []Input) (Value, error)) FunctionValueResolver {
	return &literalFunctionResolver{
		fn: resolve,
	}
}

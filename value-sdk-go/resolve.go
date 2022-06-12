package value

import (
	"context"
	"fmt"
)

// ResolveValue resolves outputs and applies functions to an input, but keeps the AST format.
func ResolveValue(
	ctx context.Context,
	value Value,
	outputResolver OutputResolver,
	configurationValueResolver ConfigurationValueResolver,
	functionValueResolver FunctionValueResolver,
) (Value, error) {
	switch value.Kind {
	case ValueKindOutput:
		if outputResolver == nil {
			return Value{}, fmt.Errorf("output value found but no output resolver provided")
		}
		outputValue := value.OutputValue
		resolvedValue, err := outputResolver.ResolveOutput(outputValue.ProjectId, outputValue.EnvironmentId, outputValue.ResourceId, outputValue.OutputName)
		if err != nil {
			return Value{}, fmt.Errorf("failed to resolve output: %w", err)
		}
		return resolvedValue, nil
	case ValueKindConfiguration:
		if configurationValueResolver == nil {
			return Value{}, fmt.Errorf("configuration value found but no resolver provided")
		}
		resolvedValue, err := configurationValueResolver.ResolveConfigurationValue(value.ConfigurationValue.ValueName)
		if err != nil {
			return Value{}, fmt.Errorf("failed to resolve configuration value: %w", err)
		}
		return resolvedValue, nil
	case ValueKindScalar:
		return value, nil
	case ValueKindList:
		for i, r := range value.ListValue.Values {
			res, err := ResolveValue(ctx, r, outputResolver, configurationValueResolver, functionValueResolver)
			if err != nil {
				return Value{}, fmt.Errorf("unable to resolve list value: %w", err)
			}
			value.ListValue.Values[i] = res
		}
		return value, nil
	case ValueKindMap:
		for i, fieldValue := range value.MapValue.Fields {
			res, err := ResolveValue(ctx, *fieldValue.FieldValue.Value, outputResolver, configurationValueResolver, functionValueResolver)
			if err != nil {
				return Value{}, fmt.Errorf("unable to resolve map value: %w", err)
			}
			value.MapValue.Fields[i].FieldValue.Value = &res
		}
		return value, nil
	case ValueKindObject:
		for i, fieldValue := range value.ObjectValue.Fields {
			res, err := ResolveValue(ctx, *fieldValue.FieldValue.Value, outputResolver, configurationValueResolver, functionValueResolver)
			if err != nil {
				return Value{}, fmt.Errorf("unable to resolve object value: %w", err)
			}
			value.ObjectValue.Fields[i].FieldValue.Value = &res
		}
		return value, nil
	case ValueKindFunction:
		if functionValueResolver == nil {
			return Value{}, fmt.Errorf("function value found but no resolver provided")
		}

		funcVal := value.FunctionValue

		// Resolve arguments first
		var resolvedArgumentValues []Input
		for _, argumentValue := range funcVal.ArgumentValues {
			if argumentValue.Kind != ValueKindFunctionArgument {
				return Value{}, fmt.Errorf("unexpected value kind for function argument: %s", argumentValue.Kind)
			}

			argValue := argumentValue.FunctionArgumentValue

			if argValue.Value == nil {
				return Value{}, fmt.Errorf("function argument value is nil")
			}

			resolvedArgumentValue, err := ResolveValue(ctx, *argValue.Value, outputResolver, configurationValueResolver, functionValueResolver)
			if err != nil {
				return Value{}, fmt.Errorf("unable to resolve function argument value: %w", err)
			}
			resolvedArgumentValues = append(resolvedArgumentValues, Input{Name: argValue.Name, Value: resolvedArgumentValue})
		}

		// Then continue to resolve the function
		resolvedValue, err := functionValueResolver.ResolveFunctionValue(ctx, funcVal.ProviderId, funcVal.FunctionName, resolvedArgumentValues)
		if err != nil {
			return Value{}, fmt.Errorf("failed to resolve function value: %w", err)
		}

		return resolvedValue, nil
	default:
		return Value{}, fmt.Errorf("unable to resolve value: unknown kind %s", value.Kind)
	}
}

package value

import (
	"encoding/json"
	"fmt"
)

type ValueKind string

const (
	ValueKindAny              ValueKind = "any"
	ValueKindScalar           ValueKind = "scalar"
	ValueKindOutput           ValueKind = "output"
	ValueKindConfiguration    ValueKind = "configuration"
	ValueKindList             ValueKind = "list"
	ValueKindMap              ValueKind = "map"
	ValueKindObject           ValueKind = "object"
	ValueKindFunction         ValueKind = "function"
	ValueKindFunctionArgument ValueKind = "functionArgument"
	ValueKindField            ValueKind = "field"
)

type ScalarUnderlyingType string

const (
	ScalarUnderlyingTypeString  = "string"
	ScalarUnderlyingTypeInteger = "integer"
	ScalarUnderlyingTypeFloat   = "float"
	ScalarUnderlyingTypeBoolean = "boolean"
)

type InputDefinition struct {
	Name  string     `json:"name"`
	Value Definition `json:"value"`
}

type OutputDefinition struct {
	Name  string     `json:"name"`
	Value Definition `json:"value"`
}

type Input struct {
	Name  string `json:"name"`
	Value Value  `json:"value"`
}

type ResolvedInput struct {
	Name          string      `json:"name"`
	ResolvedValue interface{} `json:"resolvedValue"`
}

type Output struct {
	Name  string `json:"name"`
	Value Value  `json:"value"`
}

type ValueBase struct {
	IsSecret bool      `json:"isSecret,omitempty"`
	Kind     ValueKind `json:"kind"`
}

type Value struct {
	ValueBase
	ScalarValue
	OutputValue
	ConfigurationValue
	ListValue
	MapValue
	ObjectValue
	FieldValue
	FunctionValue
	FunctionArgumentValue
}

// UnmarshalJSON fixes the default behaviour of unmarshaling anonymous (embedded) structs. Usually, whenever more than one
// exported field with a struct tag is detected, all fields are ignored. This leads to not receiving object/map value Fields.
// Now we start by unmarshaling the value base, then continuing to unmarshal the specific type instead of just Unmarshaling
// the value itself. This removes all ambiguity and allows us to unmarshal the value correctly.
func (v *Value) UnmarshalJSON(encoded []byte) error {
	var valueBase ValueBase
	err := json.Unmarshal(encoded, &valueBase)
	if err != nil {
		return fmt.Errorf("failed to unmarshal value base: %w", err)
	}

	v.ValueBase = valueBase

	switch valueBase.Kind {
	case ValueKindScalar:
		var scalarValue ScalarValue
		err = json.Unmarshal(encoded, &scalarValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal scalar value: %w", err)
		}
		v.ScalarValue = scalarValue
	case ValueKindOutput:
		var outputValue OutputValue
		err = json.Unmarshal(encoded, &outputValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal output value: %w", err)
		}
		v.OutputValue = outputValue
	case ValueKindConfiguration:
		var configurationValue ConfigurationValue
		err = json.Unmarshal(encoded, &configurationValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal configuration value: %w", err)
		}
		v.ConfigurationValue = configurationValue
	case ValueKindList:
		var listValue ListValue
		err = json.Unmarshal(encoded, &listValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal list value: %w", err)
		}
		v.ListValue = listValue
	case ValueKindMap:
		var mapValue MapValue
		err = json.Unmarshal(encoded, &mapValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal map value: %w", err)
		}
		v.MapValue = mapValue
	case ValueKindObject:
		var objectValue ObjectValue
		err = json.Unmarshal(encoded, &objectValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal object value: %w", err)
		}
		v.ObjectValue = objectValue
	case ValueKindFunction:
		var functionValue FunctionValue
		err = json.Unmarshal(encoded, &functionValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal function value: %w", err)
		}
		v.FunctionValue = functionValue
	case ValueKindFunctionArgument:
		var functionArgumentValue FunctionArgumentValue
		err = json.Unmarshal(encoded, &functionArgumentValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal function argument value: %w", err)
		}
		v.FunctionArgumentValue = functionArgumentValue
	case ValueKindField:
		var fieldValue FieldValue
		err = json.Unmarshal(encoded, &fieldValue)
		if err != nil {
			return fmt.Errorf("failed to unmarshal field value: %w", err)
		}
		v.FieldValue = fieldValue
	default:
		return fmt.Errorf("unknown value kind: %s", valueBase.Kind)
	}

	return nil
}

// MarshalJSON must be called on pointers (json.Marshal(&value))
func (v *Value) MarshalJSON() ([]byte, error) {
	switch v.Kind {
	case ValueKindScalar:
		type valueScalar struct {
			ValueBase
			ScalarValue
		}

		return json.Marshal(&valueScalar{
			ValueBase:   v.ValueBase,
			ScalarValue: v.ScalarValue,
		})
	case ValueKindOutput:
		type valueOutput struct {
			ValueBase
			OutputValue
		}

		return json.Marshal(&valueOutput{
			ValueBase:   v.ValueBase,
			OutputValue: v.OutputValue,
		})
	case ValueKindConfiguration:
		type valueConfiguration struct {
			ValueBase
			ConfigurationValue
		}

		return json.Marshal(&valueConfiguration{
			ValueBase:          v.ValueBase,
			ConfigurationValue: v.ConfigurationValue,
		})
	case ValueKindList:
		type valueList struct {
			ValueBase
			ListValue
		}

		return json.Marshal(&valueList{
			ValueBase: v.ValueBase,
			ListValue: v.ListValue,
		})
	case ValueKindMap:
		type valueMap struct {
			ValueBase
			MapValue
		}

		return json.Marshal(&valueMap{
			ValueBase: v.ValueBase,
			MapValue:  v.MapValue,
		})
	case ValueKindObject:
		type valueObject struct {
			ValueBase
			ObjectValue
		}

		return json.Marshal(&valueObject{
			ValueBase:   v.ValueBase,
			ObjectValue: v.ObjectValue,
		})
	case ValueKindField:
		type valueField struct {
			ValueBase
			FieldValue
		}

		return json.Marshal(&valueField{
			ValueBase:  v.ValueBase,
			FieldValue: v.FieldValue,
		})
	case ValueKindFunction:
		type valueFunction struct {
			ValueBase
			FunctionValue
		}

		return json.Marshal(&valueFunction{
			ValueBase:     v.ValueBase,
			FunctionValue: v.FunctionValue,
		})
	case ValueKindFunctionArgument:
		type valueFunctionArgument struct {
			ValueBase
			FunctionArgumentValue
		}

		return json.Marshal(&valueFunctionArgument{
			ValueBase:             v.ValueBase,
			FunctionArgumentValue: v.FunctionArgumentValue,
		})
	default:
		return nil, fmt.Errorf("unknown value kind: %s", v.Kind)
	}
}

type ScalarValue struct {
	SerializedValue string               `json:"serializedValue,omitempty"`
	UnderlyingType  ScalarUnderlyingType `json:"underlyingType"`
}

type OutputValue struct {
	ProjectId     string `json:"projectId"`
	EnvironmentId string `json:"environmentId"`
	ResourceId    string `json:"resourceId"`
	OutputName    string `json:"outputName"`
}

type ConfigurationValue struct {
	ValueName string `json:"valueName"`
}

type FieldValue struct {
	Name  string `json:"name"`
	Value *Value `json:"value"`
}

type ObjectValue struct {
	Fields []Value `json:"fields"`
}

type MapValue struct {
	Fields []Value `json:"fields"`
}

type ListValue struct {
	Values []Value `json:"values"`
}

type FunctionArgumentValue struct {
	Name  string `json:"name"`
	Value *Value `json:"value"`
}

type FunctionValue struct {
	FunctionName   string  `json:"functionName"`
	ProviderId     string  `json:"providerId"`
	ArgumentValues []Value `json:"argumentValues"`
}

type ValueRenderingOptions struct {
	DisplayName      string `json:"displayName,omitempty"`
	DocumentationUrl string `json:"documentationUrl,omitempty"`
	ShortDescription string `json:"shortDescription,omitempty"`
	Documentation    string `json:"documentation,omitempty"`
}

type ResourceOptions struct {
	ReplaceOnChange bool `json:"replaceOnChange,omitempty"`
}

type DefinitionBase struct {
	Kind       ValueKind              `json:"kind"`
	IsRequired bool                   `json:"isRequired,omitempty"`
	IsSecret   bool                   `json:"isSecret,omitempty"`
	Rendering  *ValueRenderingOptions `json:"rendering,omitempty"`
	Resource   *ResourceOptions       `json:"resource,omitempty"`
}

type ScalarDefinition struct {
	ExpectedUnderlyingType ScalarUnderlyingType `json:"expectedUnderlyingType,omitempty"`
	IsMultiLine            bool                 `json:"isMultiLine,omitempty"`
}

type ObjectDefinition struct {
	Name   string       `json:"name"`
	Fields []Definition `json:"fields"`
}

type FieldDefinition struct {
	Name  string      `json:"name"`
	Value *Definition `json:"value"`
}

type MapDefinition struct {
	Value *Definition `json:"value"`
}

type ListDefinition struct {
	Value *Definition `json:"value"`
}

type FunctionArgumentDefinition struct {
	Name  string      `json:"name"`
	Value *Definition `json:"value"`
}

type FunctionDefinition struct {
	Name      string       `json:"name"`
	Arguments []Definition `json:"arguments"`
	Value     *Definition  `json:"value"`
}

// AnyDefinition allows to use any value. Only supported for function arguments.
type AnyDefinition struct{}

type Definition struct {
	DefinitionBase
	ScalarDefinition
	ObjectDefinition
	MapDefinition
	FieldDefinition
	ListDefinition
	FunctionArgumentDefinition
	FunctionDefinition
	AnyDefinition
}

// UnmarshalJSON deserializes value definition.
func (d *Definition) UnmarshalJSON(encoded []byte) error {
	var definitionBase DefinitionBase
	err := json.Unmarshal(encoded, &definitionBase)
	if err != nil {
		return fmt.Errorf("failed to unmarshal definition base: %w", err)
	}

	d.DefinitionBase = definitionBase

	switch definitionBase.Kind {
	case ValueKindAny:
		return nil
	case ValueKindScalar:
		var scalarDef ScalarDefinition
		err = json.Unmarshal(encoded, &scalarDef)
		if err != nil {
			return fmt.Errorf("failed to unmarshal scalar definition: %w", err)
		}
		d.ScalarDefinition = scalarDef
	case ValueKindList:
		var listDefinition ListDefinition
		err = json.Unmarshal(encoded, &listDefinition)
		if err != nil {
			return fmt.Errorf("failed to unmarshal list definition: %w", err)
		}
		d.ListDefinition = listDefinition
	case ValueKindMap:
		var mapDefinition MapDefinition
		err = json.Unmarshal(encoded, &mapDefinition)
		if err != nil {
			return fmt.Errorf("failed to unmarshal map definition: %w", err)
		}
		d.MapDefinition = mapDefinition
	case ValueKindObject:
		var objectDefinition ObjectDefinition
		err = json.Unmarshal(encoded, &objectDefinition)
		if err != nil {
			return fmt.Errorf("failed to unmarshal object definition: %w", err)
		}
		d.ObjectDefinition = objectDefinition
	case ValueKindField:
		var fieldDefinition FieldDefinition
		err = json.Unmarshal(encoded, &fieldDefinition)
		if err != nil {
			return fmt.Errorf("failed to unmarshal field definition: %w", err)
		}
		d.FieldDefinition = fieldDefinition
	case ValueKindFunction:
		var functionDefinition FunctionDefinition
		err = json.Unmarshal(encoded, &functionDefinition)
		if err != nil {
			return fmt.Errorf("failed to unmarshal function definition: %w", err)
		}
		d.FunctionDefinition = functionDefinition
	case ValueKindFunctionArgument:
		var functionArgumentDefinition FunctionArgumentDefinition
		err = json.Unmarshal(encoded, &functionArgumentDefinition)
		if err != nil {
			return fmt.Errorf("failed to unmarshal function argument definition: %w", err)
		}
		d.FunctionArgumentDefinition = functionArgumentDefinition
	default:
		return fmt.Errorf("unknown definition kind: %s", definitionBase.Kind)
	}

	return nil
}

// MarshalJSON must be called on pointers (json.Marshal(&def))
func (d *Definition) MarshalJSON() ([]byte, error) {
	switch d.Kind {
	case ValueKindAny:
		type definitionAny struct {
			DefinitionBase
			AnyDefinition
		}

		return json.Marshal(definitionAny{
			DefinitionBase: d.DefinitionBase,
			AnyDefinition:  AnyDefinition{},
		})
	case ValueKindScalar:
		type definitionScalar struct {
			DefinitionBase
			ScalarDefinition
		}

		return json.Marshal(&definitionScalar{
			DefinitionBase:   d.DefinitionBase,
			ScalarDefinition: d.ScalarDefinition,
		})
	case ValueKindList:
		type definitionList struct {
			DefinitionBase
			ListDefinition
		}

		return json.Marshal(&definitionList{
			DefinitionBase: d.DefinitionBase,
			ListDefinition: d.ListDefinition,
		})
	case ValueKindMap:
		type definitionMap struct {
			DefinitionBase
			MapDefinition
		}

		return json.Marshal(&definitionMap{
			DefinitionBase: d.DefinitionBase,
			MapDefinition:  d.MapDefinition,
		})
	case ValueKindObject:
		type definitionObject struct {
			DefinitionBase
			ObjectDefinition
		}

		return json.Marshal(&definitionObject{
			DefinitionBase:   d.DefinitionBase,
			ObjectDefinition: d.ObjectDefinition,
		})
	case ValueKindField:
		type definitionField struct {
			DefinitionBase
			FieldDefinition
		}

		return json.Marshal(&definitionField{
			DefinitionBase:  d.DefinitionBase,
			FieldDefinition: d.FieldDefinition,
		})
	case ValueKindFunction:
		type definitionFunction struct {
			DefinitionBase
			FunctionDefinition
		}

		return json.Marshal(&definitionFunction{
			DefinitionBase:     d.DefinitionBase,
			FunctionDefinition: d.FunctionDefinition,
		})
	case ValueKindFunctionArgument:
		type definitionFunctionArgument struct {
			DefinitionBase
			FunctionArgumentDefinition
		}

		return json.Marshal(&definitionFunctionArgument{
			DefinitionBase:             d.DefinitionBase,
			FunctionArgumentDefinition: d.FunctionArgumentDefinition,
		})
	default:
		return nil, fmt.Errorf("unknown definition kind: %s", d.Kind)
	}
}

/* In the following, we define core structural types for our values, which cover the possible JSON types */

export enum ValueKind {
  Any = "any",
  Scalar = "scalar",
  List = "list",
  Object = "object",
  Map = "map",
  Output = "output",
  Configuration = "configuration",
  Field = "field",
  Function = "function",
  FunctionArgument = "functionArgument",
}

export interface ValueRenderingOptions {
  displayName?: string;
  documentationUrl?: string;
  shortDescription?: string;
  documentation?: string;
}

export interface ResourceOptions {
  replaceOnChange?: boolean;
}

export interface ValueDefinitionBase {
  kind: string;
  isRequired?: boolean;
  isSecret?: boolean;
  rendering?: ValueRenderingOptions;
  resource?: ResourceOptions;
}

export enum ScalarUnderlyingType {
  String = "string",
  Integer = "integer",
  Float = "float",
  Boolean = "boolean",
}

/**
 * A scalar represents any primary type that can be represented in a JSON value.
 */
export interface ScalarDefinition extends ValueDefinitionBase {
  kind: ValueKind.Scalar;
  expectedUnderlyingType: ScalarUnderlyingType;
  isMultiLine?: boolean;
}

/**
 * Objects are ordered key-value pairs with pre-defined fields.
 */
export interface ObjectDefinition extends ValueDefinitionBase {
  kind: ValueKind.Object;
  name: string;
  fields: ValueDefinition[];
}

export interface FieldDefinition extends ValueDefinitionBase {
  kind: ValueKind.Field;
  name: string;
  value: ValueDefinition;
}

/**
 * Maps are resolved into JSON objects, and differ from
 * regular objects in two ways: There are no explicit fields and values must be of the same type.
 *
 * Maps can be used in use cases such as environment variables where you want a key-value mapping
 * of strings to other values (of which every value has the same schema).
 *
 * Keys must be strings to match the JSON spec
 * The Value schema is determined by the `value` attribute.
 */
export interface MapDefinition extends ValueDefinitionBase {
  kind: ValueKind.Map;
  value: ValueDefinition;
}

export interface ListDefinition extends ValueDefinitionBase {
  kind: ValueKind.List;
  value: ValueDefinition;
}

export interface FunctionArgumentDefinition extends ValueDefinitionBase {
  kind: ValueKind.FunctionArgument;
  name: string;
  value: ValueDefinition;
}

export interface FunctionDefinition extends ValueDefinitionBase {
  kind: ValueKind.Function;
  name: string;

  arguments: ValueDefinition[];

  value: ValueDefinition;
}

/**
 * Allows to use any value. Only supported for function arguments.
 */
export interface AnyDefinition extends ValueDefinitionBase {
  kind: ValueKind.Any;
}

export type ValueDefinition =
  | ScalarDefinition
  | ObjectDefinition
  | MapDefinition
  | FieldDefinition
  | ListDefinition
  | FunctionDefinition
  | FunctionArgumentDefinition
  | AnyDefinition;

// Outputs are explicitly _not_ included in the types because they simply represent values managed by another resource.
// Functions are explicitly _not_ included in the types because similar to outputs, they will receive and return values of a specific schema.

export interface ValueBase {
  isSecret?: boolean;
}

export interface ScalarValue extends ValueBase {
  kind: ValueKind.Scalar;
  serializedValue: string;
  underlyingType: ScalarUnderlyingType;
}

export interface OutputValue extends ValueBase {
  kind: ValueKind.Output;
  projectId?: string;
  environmentId?: string;
  resourceId: string;
  outputName: string;
}

export interface ConfigurationValue extends ValueBase {
  kind: ValueKind.Configuration;
  valueName: string;
}

export interface FunctionArgumentValue extends ValueBase {
  kind: ValueKind.FunctionArgument;
  name: string;
  value: Value;
}

export interface FunctionValue extends ValueBase {
  kind: ValueKind.Function;
  functionName: string;

  /**
   * Refers to branch/environment provider ID
   */
  providerId: string;

  argumentValues: Value[];
}

export interface FieldValue extends ValueBase {
  kind: ValueKind.Field;
  name: string;
  value: Value;
}

export interface ObjectValue extends ValueBase {
  kind: ValueKind.Object;
  fields: Value[];
}

export interface MapValue extends ValueBase {
  kind: ValueKind.Map;
  fields: Value[];
}

export interface ListValue extends ValueBase {
  kind: ValueKind.List;
  values: Value[];
}

export type Value =
  | ScalarValue
  | ListValue
  | ObjectValue
  | MapValue
  | FieldValue
  | OutputValue
  | FunctionValue
  | FunctionArgumentValue
  | ConfigurationValue;

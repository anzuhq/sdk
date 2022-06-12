import {
  ConfigurationValue,
  FieldValue,
  FunctionArgumentValue,
  FunctionValue,
  ListValue,
  MapValue,
  ObjectValue,
  OutputValue,
  ScalarUnderlyingType,
  ScalarValue,
  Value,
  ValueKind,
} from "./ast";

export interface ParseResult {
  value: Value | null;
  errors: ParseError[];
}

function newParseResult() {
  const parseResult: ParseResult = {
    value: null,
    errors: [],
  };
  return parseResult;
}

/**
 * Will parse given raw value (parsed from JSON) to valid Value object or null with error.
 *
 * Will make sure that every value nested in the tree is structurally valid and that
 * scalar values have matching underlying and actual types.
 *
 * @param raw
 * @param path
 */
export function parseValue(raw: unknown, path: string[] = []): ParseResult {
  const result = newParseResult();

  if (typeof raw !== "object") {
    result.errors.push({
      path,
      message: `Expected an object, got ${typeof raw}`,
    });
  }

  if (!raw) {
    result.errors.push({
      path,
      message: "Expected an object, got falsy value",
    });
  }

  const value = raw as Record<string, unknown>;

  if (!("kind" in value) || typeof value.kind !== "string") {
    result.errors.push({
      path,
      message: 'Expected an object with a "kind" string property',
    });
  }

  if (result.errors.length > 0) {
    return result;
  }

  switch (value.kind) {
    case ValueKind.Scalar:
      return parseScalarValue(value, path);
    case ValueKind.Output:
      return parseOutputValue(value, path);
    case ValueKind.Configuration:
      return parseConfigurationValue(value, path);
    case ValueKind.Function:
      return parseFunctionValue(value, path);
    case ValueKind.Object:
      return parseObjectValue(value, path);
    case ValueKind.Map:
      return parseMapValue(value, path);
    case ValueKind.List:
      return parseListValue(value, path);
    case ValueKind.Field:
      return parseFieldValue(value, path);
    case ValueKind.FunctionArgument:
      return parseFunctionArgumentValue(value, path);
    default:
      throw new Error(`Unknown kind ${value.kind}`);
  }
}

export interface ParseError {
  message: string;
  path: string[];
}

function parseScalarValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();
  if (typeof value.serializedValue !== "string") {
    result.errors.push({
      message: `Expected serializedValue to be a string`,
      path,
    });

    return result;
  }

  let parsedType: ScalarUnderlyingType;
  try {
    const parsed = JSON.parse(value.serializedValue);
    switch (typeof parsed) {
      case "number":
        if (Number.isInteger(parsed)) {
          parsedType = ScalarUnderlyingType.Integer;
        } else {
          parsedType = ScalarUnderlyingType.Float;
        }
        break;
      case "boolean":
        parsedType = ScalarUnderlyingType.Boolean;
        break;
      case "string":
        parsedType = ScalarUnderlyingType.String;
        break;
      default:
        throw new Error(`Unsupported underlying scalar type ${typeof parsed}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      result.errors.push({
        message: `Serialized value is not valid JSON: ${err.message}`,
        path,
      });
    }

    return result;
  }

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (value.underlyingType !== parsedType) {
    result.errors.push({
      message: `Expected underlyingType (${value.underlyingType} to match type of serialized value (${parsedType})`,
      path,
    });
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as ScalarValue,
    errors: [],
  };
}

function parseObjectValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (!Array.isArray(value.fields)) {
    result.errors.push({
      message: `Expected fields to be an array`,
      path,
    });
    return result;
  }

  for (const [index, field] of value.fields.entries()) {
    const fieldResult = parseFieldValue(field, [...path, `fields[${index}]`]);
    if (fieldResult.errors.length > 0) {
      result.errors.push(...fieldResult.errors);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as ObjectValue,
    errors: [],
  };
}

function parseFieldValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (typeof value.name !== "string") {
    result.errors.push({
      message: `Expected field name to be a string`,
      path,
    });

    return result;
  }

  const fieldResult = parseValue(value.value, [...path, value.name]);
  if (fieldResult.errors.length > 0) {
    result.errors.push(...fieldResult.errors);
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as FieldValue,
    errors: [],
  };
}

function parseMapValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (!Array.isArray(value.entries)) {
    result.errors.push({
      message: `Expected entries to be an array`,
      path,
    });
    return result;
  }

  for (const [index, entry] of value.entries.entries()) {
    const entryResult = parseFieldValue(entry, [...path, `values[${index}]`]);
    if (entryResult.errors.length > 0) {
      result.errors.push(...entryResult.errors);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as MapValue,
    errors: [],
  };
}

function parseFunctionArgumentValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (typeof value.name !== "string") {
    result.errors.push({
      message: `Expected argument name to be a string`,
      path,
    });

    return result;
  }

  const fieldResult = parseValue(value.value, [...path, value.name]);
  if (fieldResult.errors.length > 0) {
    result.errors.push(...fieldResult.errors);
  }

  if (result.errors.length > 0) {
    return result;
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as FunctionArgumentValue,
    errors: [],
  };
}

function parseFunctionValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (typeof value.functionName !== "string") {
    result.errors.push({
      message: `Expected function name to be a string`,
      path,
    });
    return result;
  }

  if (typeof value.provider !== "string") {
    result.errors.push({
      message: `Expected provider to be a string`,
      path,
    });
  }

  if (!Array.isArray(value.arguments)) {
    result.errors.push({
      message: `Expected arguments to be an array`,
      path,
    });
    return result;
  }

  for (const argument of value.arguments) {
    const argumentResult = parseFunctionArgumentValue(argument, [
      ...path,
      value.functionName,
    ]);
    if (argumentResult.errors.length > 0) {
      result.errors.push(...argumentResult.errors);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as FunctionValue,
    errors: [],
  };
}

function parseListValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (!Array.isArray(value.values)) {
    result.errors.push({
      message: `Expected values to be an array`,
      path,
    });
    return result;
  }

  for (const [index, entry] of value.values.entries()) {
    const entryResult = parseValue(entry, [...path, `values[${index}]`]);
    if (entryResult.errors.length > 0) {
      result.errors.push(...entryResult.errors);
    }
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as ListValue,
    errors: [],
  };
}

function parseOutputValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (typeof value.projectId !== "string") {
    result.errors.push({
      message: `Expected projectId to be a string`,
      path,
    });
  }

  if (typeof value.environmentId !== "string") {
    result.errors.push({
      message: `Expected environmentId to be a string`,
      path,
    });
  }

  if (typeof value.outputName !== "string") {
    result.errors.push({
      message: `Expected output outputName to be a string`,
      path,
    });
  }

  if (typeof value.resourceId !== "string") {
    result.errors.push({
      message: `Expected output resourceId to be a string`,
      path,
    });
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as OutputValue,
    errors: [],
  };
}

function parseConfigurationValue(
  value: Record<string, unknown>,
  path: string[]
): ParseResult {
  const result = newParseResult();

  if (value.isSecret !== undefined && typeof value.isSecret !== "boolean") {
    result.errors.push({
      message: `Expected isSecret to be a boolean`,
      path,
    });
  }

  if (typeof value.valueName !== "string") {
    result.errors.push({
      message: `Expected valueName to be a string`,
      path,
    });
  }

  if (result.errors.length > 0) {
    return result;
  }

  return {
    value: value as unknown as ConfigurationValue,
    errors: [],
  };
}

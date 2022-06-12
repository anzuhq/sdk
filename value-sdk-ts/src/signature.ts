import {
  AnyDefinition,
  ListDefinition,
  MapDefinition,
  ObjectDefinition,
  ScalarDefinition,
  ValueDefinition,
  ValueKind,
} from "./ast";

/**
 * Generates signature string for value definition.
 *
 * Can be used to compare definition-fit quickly.
 * @param def
 */
export function generateSignature(
  def: ValueDefinition,
  topLevelRequired = false
): string {
  switch (def.kind) {
    case ValueKind.Any:
      return generateAnySignature(def, topLevelRequired);
    case ValueKind.Scalar:
      return generateScalarSignature(def, topLevelRequired);
    case ValueKind.List:
      return generateListSignature(def, topLevelRequired);
    case ValueKind.Object:
      return generateObjectSignature(def, topLevelRequired);
    case ValueKind.Map:
      return generateMapSignature(def, topLevelRequired);
    default:
      throw new Error(`Unsupported value definition kind: ${def.kind}`);
  }
}

function generateAnySignature(
  def: AnyDefinition,
  topLevelRequired: boolean
): string {
  return `any${topLevelRequired || def.isRequired ? "!" : ""}`;
}

function generateScalarSignature(
  def: ScalarDefinition,
  topLevelRequired: boolean
): string {
  return `${def.expectedUnderlyingType}${
    topLevelRequired || def.isRequired ? "!" : ""
  }`;
}

function generateListSignature(
  def: ListDefinition,
  topLevelRequired: boolean
): string {
  return `${generateSignature(def.value)}[]${
    topLevelRequired || def.isRequired ? "!" : ""
  }`;
}

function generateMapSignature(
  def: MapDefinition,
  topLevelRequired: boolean
): string {
  return `map${
    topLevelRequired || def.isRequired ? "!" : ""
  }[string]${generateSignature(def.value)}`;
}

function generateObjectSignature(
  def: ObjectDefinition,
  topLevelRequired: boolean
): string {
  // TODO We might want to expand into object fields to compare non-matching type names as well
  return `${def.name}${topLevelRequired || def.isRequired ? "!" : ""}`;
}

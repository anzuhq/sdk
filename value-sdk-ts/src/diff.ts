import {
  ConfigurationValue,
  FunctionArgumentValue,
  FunctionDefinition,
  FunctionValue,
  ListDefinition,
  ListValue,
  MapDefinition,
  MapValue,
  ObjectDefinition,
  ObjectValue,
  OutputValue,
  ScalarValue,
  Value,
  ValueDefinition,
  ValueKind,
} from "./ast";

export enum ValueChangeReason {
  DifferentKind = "DIFFERENT_KIND",

  ScalarUnderlyingTypeChanged = "SCALAR_UNDERLYING_TYPE_CHANGED",
  ScalarSerializedValueChanged = "SCALAR_SERIALIZED_VALUE_CHANGED",

  ListLengthChanged = "LIST_LENGTH_CHANGED",
  ListItemChanged = "LIST_ITEM_CHANGED",

  ObjectFieldCountChanged = "OBJECT_FIELD_COUNT_CHANGED",
  ObjectFieldAdded = "OBJECT_FIELD_ADDED",
  ObjectFieldRemoved = "OBJECT_FIELD_REMOVED",
  ObjectFieldsChanged = "OBJECT_FIELDS_CHANGED",

  MapFieldCountChanged = "MAP_FIELD_COUNT_CHANGED",
  MapFieldAdded = "MAP_FIELD_ADDED",
  MapFieldRemoved = "MAP_FIELD_REMOVED",
  MapFieldsChanged = "MAP_FIELDS_CHANGED",

  OutputValueChanged = "OUTPUT_VALUE_CHANGED",
  OutputValueDrift = "OUTPUT_VALUE_DRIFT",

  ConfigurationValueChanged = "CONFIGURATION_VALUE_CHANGED",

  FunctionChanged = "FUNCTION_CHANGED",
}

/**
 * Represents a change to a value
 *
 * When value is nested, contains nested changes causing a top-level change.
 */
export interface ValueChange {
  reason: ValueChangeReason;
  path: string[];
  shouldReplace?: boolean;
  changes?: ValueChange[];
}

function objectDefinitionEqual(
  a: ObjectDefinition,
  b: ObjectDefinition
): boolean {
  for (const aField of a.fields) {
    if (aField.kind !== ValueKind.Field) {
      continue;
    }

    const bField = b.fields.find(
      (f) => f.kind === ValueKind.Field && f.name === aField.name
    );
    if (!bField || bField.kind !== ValueKind.Field) {
      return false;
    }

    if (aField.isRequired !== bField.isRequired) {
      return false;
    }

    if (!doesDefinitionFit(aField.value, bField.value)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a value definition fits another definition.
 * @param a
 * @param matchesA
 */
export function doesDefinitionFit(
  a: ValueDefinition,
  matchesA: ValueDefinition
): boolean {
  if (a.kind !== matchesA.kind) {
    return false;
  }

  if (a.kind === "any" || matchesA.kind === "any") {
    return true;
  }

  // When a is required but matchesA is not, the value can never be equal.
  // When a is not required but matchesA is required, this is fine.
  // When both are required or not required, the values can be equal.
  if (a.isRequired && !matchesA.isRequired) {
    return false;
  }

  if (a.kind === "list" && matchesA.kind === "list") {
    return doesDefinitionFit(a.value, matchesA.value);
  }

  if (a.kind === "object" && matchesA.kind === "object") {
    return (
      objectDefinitionEqual(a, matchesA) && objectDefinitionEqual(matchesA, a)
    );
  }

  if (a.kind === "map" && matchesA.kind === "map") {
    return doesDefinitionFit(a.value, matchesA.value);
  }

  if (a.kind === "scalar" && matchesA.kind === "scalar") {
    return a.expectedUnderlyingType === matchesA.expectedUnderlyingType;
  }

  return false;
}

export async function diffValue(
  previousValue: Value,
  nextValue: Value,
  definition: ValueDefinition,
  didOutputChange: didOutputValueChangeFn,
  didConfigurationValueChangeFn: didConfigurationValueChangeFn,
  functionDefinition: (
    providerId: string,
    functionName: string
  ) => Promise<FunctionDefinition>,
  path: string[] = []
): Promise<ValueChange | null> {
  if (previousValue.kind !== nextValue.kind) {
    return {
      shouldReplace: definition.resource?.replaceOnChange,
      reason: ValueChangeReason.DifferentKind,
      path,
    };
  }

  if (previousValue.kind === "scalar" && nextValue.kind === "scalar") {
    return diffScalarValue(previousValue, nextValue, definition, path);
  }

  if (
    previousValue.kind === "list" &&
    nextValue.kind === "list" &&
    definition.kind === "list"
  ) {
    return diffListValue(
      previousValue,
      nextValue,
      definition,
      didOutputChange,
      didConfigurationValueChangeFn,
      functionDefinition,
      path
    );
  }

  if (
    previousValue.kind === "object" &&
    nextValue.kind === "object" &&
    definition.kind === "object"
  ) {
    return diffObjectValue(
      previousValue,
      nextValue,
      definition,
      didOutputChange,
      didConfigurationValueChangeFn,
      functionDefinition,
      path
    );
  }

  if (
    previousValue.kind === "map" &&
    nextValue.kind === "map" &&
    definition.kind === "map"
  ) {
    return diffMapValue(
      previousValue,
      nextValue,
      definition,
      didOutputChange,
      didConfigurationValueChangeFn,
      functionDefinition,
      path
    );
  }

  if (previousValue.kind === "output" && nextValue.kind === "output") {
    return diffOutputValue(
      previousValue,
      nextValue,
      definition,
      didOutputChange,
      path
    );
  }

  if (
    previousValue.kind === ValueKind.Configuration &&
    nextValue.kind === ValueKind.Configuration
  ) {
    return diffConfigurationValue(
      previousValue,
      nextValue,
      definition,
      didConfigurationValueChangeFn,
      path
    );
  }

  if (previousValue.kind === "function" && nextValue.kind === "function") {
    return diffFunctionValue(
      previousValue,
      nextValue,
      definition,
      didOutputChange,
      didConfigurationValueChangeFn,
      functionDefinition,
      path
    );
  }

  throw new Error(`Unsupported value kind: ${previousValue.kind}`);
}

async function diffConfigurationValue(
  previous: ConfigurationValue,
  nextValue: ConfigurationValue,
  definition: ValueDefinition,
  didConfigurationValueChange: didConfigurationValueChangeFn,
  path: string[]
) {
  if (previous.valueName !== nextValue.valueName) {
    return {
      shouldReplace: definition.resource?.replaceOnChange,
      reason: ValueChangeReason.ConfigurationValueChanged,
      path,
    };
  }

  const valueChanged = await didConfigurationValueChange(nextValue.valueName);
  if (valueChanged) {
    return {
      shouldReplace: definition.resource?.replaceOnChange,
      reason: ValueChangeReason.ConfigurationValueChanged,
      path,
    };
  }

  return null;
}

async function diffScalarValue(
  previous: ScalarValue,
  nextValue: ScalarValue,
  definition: ValueDefinition,
  path: string[]
): Promise<ValueChange | null> {
  if (previous.underlyingType !== nextValue.underlyingType) {
    return {
      shouldReplace: definition.resource?.replaceOnChange,
      reason: ValueChangeReason.ScalarUnderlyingTypeChanged,
      path,
    };
  }

  if (previous.serializedValue !== nextValue.serializedValue) {
    return {
      shouldReplace: definition.resource?.replaceOnChange,
      path,
      reason: ValueChangeReason.ScalarSerializedValueChanged,
    };
  }

  return null;
}

type didOutputValueChangeFn = (
  outputName: string,
  resourceId: string,
  environmentId?: string,
  projectId?: string
) => Promise<"drift" | "outputChanged" | null>;

type didConfigurationValueChangeFn = (
  valueName: string
) => Promise<"configurationValueAdded" | "configurationValueChanged" | null>;

async function diffOutputValue(
  previousValue: OutputValue,
  nextValue: OutputValue,
  definition: ValueDefinition,
  didOutputChange: didOutputValueChangeFn,
  path: string[]
): Promise<ValueChange | null> {
  const shouldReplace = definition.resource?.replaceOnChange;
  const changed: ValueChange = {
    shouldReplace,
    reason: ValueChangeReason.OutputValueChanged,
    path,
  };

  if (previousValue.projectId !== nextValue.projectId) {
    return changed;
  }

  if (previousValue.environmentId !== nextValue.environmentId) {
    return changed;
  }

  if (previousValue.resourceId !== nextValue.resourceId) {
    return changed;
  }

  if (previousValue.outputName !== nextValue.outputName) {
    return changed;
  }

  const outputChanged = await didOutputChange(
    previousValue.outputName,
    previousValue.resourceId,
    previousValue.projectId,
    previousValue.environmentId
  );
  if (outputChanged) {
    return {
      path,
      shouldReplace,
      reason:
        outputChanged === "drift"
          ? ValueChangeReason.OutputValueDrift
          : ValueChangeReason.OutputValueChanged,
    };
  }

  return null;
}

async function diffListValue(
  previousValue: ListValue,
  nextValue: ListValue,
  definition: ListDefinition,
  didOutputChange: didOutputValueChangeFn,
  didConfigurationValueChange: didConfigurationValueChangeFn,
  functionDefinition: (
    providerId: string,
    functionName: string
  ) => Promise<FunctionDefinition>,
  path: string[]
): Promise<ValueChange | null> {
  const shouldReplace = definition.resource?.replaceOnChange;

  // A list value changes when it has a different number of elements
  if (previousValue.values.length !== nextValue.values.length) {
    return { shouldReplace, path, reason: ValueChangeReason.ListLengthChanged };
  }

  const changes: ValueChange[] = [];

  // Or when it has the same number of elements
  for (let i = 0; i < previousValue.values.length; i++) {
    const prev = previousValue.values[i];
    const next = nextValue.values[i];
    // And the elements are different (or in a different order)
    const change = await diffValue(
      prev,
      next,
      definition.value,
      didOutputChange,
      didConfigurationValueChange,
      functionDefinition,
      [...path, `${i}`]
    );
    if (change !== null) {
      changes.push(change);
    }
  }

  return changes.length > 0
    ? {
        reason: ValueChangeReason.ListItemChanged,
        path,
        shouldReplace: changes.some((c) => c.shouldReplace) || shouldReplace,
        changes,
      }
    : null;
}

async function diffObjectValue(
  previousValue: ObjectValue,
  nextValue: ObjectValue,
  definition: ObjectDefinition,
  didOutputChange: didOutputValueChangeFn,
  didConfigurationValueChange: didConfigurationValueChangeFn,
  functionDefinition: (
    providerId: string,
    functionName: string
  ) => Promise<FunctionDefinition>,
  path: string[]
): Promise<ValueChange | null> {
  const shouldReplace = definition.resource?.replaceOnChange;

  // An object value changes when it has a different number of fields
  if (previousValue.fields.length !== nextValue.fields.length) {
    return {
      shouldReplace,
      path,
      reason: ValueChangeReason.ObjectFieldCountChanged,
    };
  }

  const changes: ValueChange[] = [];

  // Or when it has the same number of fields
  for (const fieldDef of definition.fields) {
    if (fieldDef.kind !== ValueKind.Field) {
      continue;
    }

    const previousField = previousValue.fields.find(
      (f) => f.kind === ValueKind.Field && f.name === fieldDef.name
    );
    const nextField = nextValue.fields.find(
      (f) => f.kind === ValueKind.Field && f.name === fieldDef.name
    );

    // When both fields are absent, this is not a change
    if (!previousField && !nextField) {
      continue;
    }

    // If the field is absent in one side, it's a change
    if (
      !previousField ||
      !nextField ||
      previousField.kind !== ValueKind.Field ||
      nextField.kind !== ValueKind.Field
    ) {
      changes.push({
        path: [...path, fieldDef.name],
        reason: !previousField
          ? ValueChangeReason.ObjectFieldAdded
          : ValueChangeReason.ObjectFieldRemoved,
        shouldReplace: fieldDef.resource?.replaceOnChange,
      });
      continue;
    }

    // If the field is present in both sides, and the value is different, it's a change
    const change = await diffValue(
      previousField.value,
      nextField.value,
      fieldDef.value,
      didOutputChange,
      didConfigurationValueChange,
      functionDefinition,
      [...path, fieldDef.name]
    );
    if (change) {
      changes.push(change);
    }
  }

  return changes.length > 0
    ? {
        reason: ValueChangeReason.ObjectFieldsChanged,
        shouldReplace: changes.some((c) => c.shouldReplace) || shouldReplace,
        changes,
        path,
      }
    : null;
}

async function diffMapValue(
  previousValue: MapValue,
  nextValue: MapValue,
  definition: MapDefinition,
  didOutputChange: didOutputValueChangeFn,
  didConfigurationValueChange: didConfigurationValueChangeFn,
  functionDefinition: (
    providerId: string,
    functionName: string
  ) => Promise<FunctionDefinition>,
  path: string[]
): Promise<ValueChange | null> {
  const shouldReplace = definition.resource?.replaceOnChange;

  // A map value changes when it has a different number of fields
  if (previousValue.fields.length !== nextValue.fields.length) {
    return {
      shouldReplace,
      path,
      reason: ValueChangeReason.MapFieldCountChanged,
    };
  }

  // Or when it has the same number of fields and
  const changes: ValueChange[] = [];
  for (const previousField of previousValue.fields) {
    if (previousField.kind !== ValueKind.Field) {
      continue;
    }

    // When the field is absent in the next value, it's a change
    const nextField = nextValue.fields.find(
      (f) => f.kind === ValueKind.Field && f.name === previousField.name
    );
    if (!nextField || nextField.kind !== ValueKind.Field) {
      changes.push({
        path: [...path, previousField.name],
        reason: ValueChangeReason.MapFieldRemoved,
      });
      continue;
    }

    // If the field is present in both sides, and the value is different, it's a change
    const change = await diffValue(
      previousField.value,
      nextField.value,
      definition.value,
      didOutputChange,
      didConfigurationValueChange,
      functionDefinition,
      [...path, previousField.name]
    );
    if (change) {
      changes.push(change);
    }
  }

  for (const nextField of nextValue.fields) {
    if (nextField.kind !== ValueKind.Field) {
      continue;
    }
    const previousField = previousValue.fields.find(
      (f) => f.kind === ValueKind.Field && f.name === nextField.name
    );
    if (!previousField || previousField.kind != ValueKind.Field) {
      changes.push({ path, reason: ValueChangeReason.MapFieldAdded });
    }
  }

  return changes.length > 0
    ? {
        reason: ValueChangeReason.MapFieldsChanged,
        changes,
        path,
        shouldReplace: changes.some((c) => c.shouldReplace) || shouldReplace,
      }
    : null;
}

async function diffFunctionValue(
  previousValue: FunctionValue,
  nextValue: FunctionValue,
  definition: ValueDefinition,
  didOutputChange: didOutputValueChangeFn,
  didConfigurationValueChange: didConfigurationValueChangeFn,
  functionDefinition: (
    providerId: string,
    functionName: string
  ) => Promise<FunctionDefinition>,
  path: string[]
): Promise<ValueChange | null> {
  const shouldReplace = definition.resource?.replaceOnChange;
  const changed: ValueChange = {
    shouldReplace,
    reason: ValueChangeReason.FunctionChanged,
    path,
  };

  if (previousValue.providerId !== nextValue.providerId) {
    return changed;
  }

  if (previousValue.functionName !== nextValue.functionName) {
    return changed;
  }

  const funcDef = await functionDefinition(
    nextValue.providerId,
    nextValue.functionName
  );

  for (const argDef of funcDef.arguments) {
    if (argDef.kind !== ValueKind.FunctionArgument) {
      throw new Error("Expected argument definition");
    }

    const prevArgument = previousValue.argumentValues.find(
      (v) => v.kind === ValueKind.FunctionArgument && v.name === argDef.name
    ) as FunctionArgumentValue | undefined;
    const nextArgument = nextValue.argumentValues.find(
      (a) => a.kind === ValueKind.FunctionArgument && a.name === argDef.name
    ) as FunctionArgumentValue | undefined;

    if (!prevArgument && !nextArgument) {
      continue;
    }

    if ((prevArgument && !nextArgument) || (!prevArgument && nextArgument)) {
      return changed;
    }

    if (!(prevArgument && nextArgument)) {
      throw new Error(
        "Invalid code path, expected both arguments to be present"
      );
    }

    const change = await diffValue(
      prevArgument.value,
      nextArgument.value,
      argDef.value,
      didOutputChange,
      didConfigurationValueChange,
      functionDefinition,
      [...path, prevArgument.name]
    );
    if (change) {
      return change;
    }
  }

  for (const nextArgument of nextValue.argumentValues) {
    if (nextArgument.kind !== ValueKind.FunctionArgument) {
      continue;
    }
    const prevArgument = previousValue.argumentValues.find(
      (a) =>
        a.kind === ValueKind.FunctionArgument && a.name === nextArgument.name
    );
    if (!prevArgument) {
      return changed;
    }
  }

  return null;
}

import {
  FieldValue,
  FunctionArgumentValue,
  FunctionDefinition,
  Value,
  ValueDefinition,
  ValueKind,
} from "./ast";
import { doesDefinitionFit } from "./diff";

export interface ValueValidationError {
  message: string;
  path: string[];
}

export interface ValidationResult {
  errors: ValueValidationError[];
}

/**
 * Given a value and its definition, walk the definition and validate that value kind matches between the passed value and its definition.
 * @param value
 * @param definition
 * @param valueDefinitionForOutput
 * @param valueDefinitionForConfig
 * @param functionDefinition
 * @param path
 */
export async function validateValue(
  value: Value | null,
  definition: ValueDefinition,
  valueDefinitionForOutput: (
    resourceId: string,
    outputName: string
  ) => Promise<ValueDefinition>,
  valueDefinitionForConfig: (valueName: string) => Promise<ValueDefinition>,
  functionDefinition: (
    providerId: string,
    functionName: string
  ) => Promise<FunctionDefinition>,
  path: string[] = []
): Promise<ValidationResult> {
  const errors: ValueValidationError[] = [];

  // If we walk over an any-definition, we don't need to validate anything.
  if (definition.kind === "any") {
    return { errors };
  }

  if (value === null) {
    if (definition.isRequired) {
      errors.push({
        message: `Value is required`,
        path,
      });
    }

    return { errors };
  }

  if (value.kind === "output") {
    // Since we do not know the output value upfront, we need to compare the definition with the output definition
    // If they match, the output provides a fitting value and validation can be moved to the output itself to ensure it matches its definition
    const outputDef = await valueDefinitionForOutput(
      value.resourceId,
      value.outputName
    );
    if (!doesDefinitionFit(definition, outputDef)) {
      errors.push({
        message: `Output value does not match definition`,
        path,
      });
    }

    return { errors };
  }

  if (value.kind === ValueKind.Configuration) {
    const configValueDef = await valueDefinitionForConfig(value.valueName);
    if (!doesDefinitionFit(definition, configValueDef)) {
      errors.push({
        message: `Configuration value does not match definition`,
        path,
      });
    }

    return { errors };
  }

  if (value.kind === "function") {
    const functionDef = await functionDefinition(
      value.providerId,
      value.functionName
    );

    // Validate function return type matches current value definition
    if (!doesDefinitionFit(definition, functionDef.value)) {
      errors.push({
        message: `Function return value definition does not match definition`,
        path,
      });
    }

    for (const argumentDef of functionDef.arguments) {
      if (argumentDef.kind !== ValueKind.FunctionArgument) {
        continue;
      }

      // Validate function argument was provided if required
      const argumentValue = value.argumentValues.find(
        (arg) =>
          arg.kind === ValueKind.FunctionArgument &&
          arg.name === argumentDef.name
      ) as FunctionArgumentValue | undefined;
      if (!argumentValue) {
        if (argumentDef.isRequired) {
          errors.push({
            message: `Function argument is required`,
            path: [...path, argumentDef.name],
          });
        }

        continue;
      }

      // Validate argument value definition against provided argument value
      const { errors: argumentErrors } = await validateValue(
        argumentValue.value,
        argumentDef.value,
        valueDefinitionForOutput,
        valueDefinitionForConfig,
        functionDefinition,
        [...path, argumentDef.name]
      );
      errors.push(...argumentErrors);
    }

    return { errors };
  }

  if (value.kind !== definition.kind) {
    errors.push({
      message: `Expected value of kind ${definition.kind}, but got ${value.kind}`,
      path,
    });

    return { errors };
  }

  if (definition.kind === "list" && value.kind === "list") {
    for (const [idx, listValue] of value.values.entries()) {
      const { errors: listErrors } = await validateValue(
        listValue,
        definition.value,
        valueDefinitionForOutput,
        valueDefinitionForConfig,
        functionDefinition,
        [...path, `${idx}`]
      );
      errors.push(...listErrors);
    }
  }

  if (definition.kind === "object" && value.kind === "object") {
    for (const field of definition.fields) {
      if (field.kind !== ValueKind.Field) {
        continue;
      }

      const foundValue = value.fields.find(
        (f) => f.kind === ValueKind.Field && f.name === field.name
      ) as FieldValue | undefined;
      const { errors: listErrors } = await validateValue(
        foundValue?.value || null,
        field.value,
        valueDefinitionForOutput,
        valueDefinitionForConfig,
        functionDefinition,
        [...path, `${field.name}`]
      );
      errors.push(...listErrors);
    }

    for (const field of value.fields) {
      if (field.kind !== ValueKind.Field) {
        continue;
      }

      const foundDefinition = definition.fields.find(
        (f) => f.kind === ValueKind.Field && f.name === field.name
      );
      if (!foundDefinition) {
        errors.push({
          message: `Unexpected field ${field.name}`,
          path: [...path, `${field.name}`],
        });
      }
    }
  }

  if (definition.kind === "map" && value.kind === "map") {
    for (const field of value.fields) {
      if (field.kind !== ValueKind.Field) {
        continue;
      }
      const { errors: fieldErrors } = await validateValue(
        field.value,
        definition.value,
        valueDefinitionForOutput,
        valueDefinitionForConfig,
        functionDefinition,
        [...path, `${field.name}`]
      );
      errors.push(...fieldErrors);
    }
  }

  if (definition.kind === "scalar" && value.kind === "scalar") {
    if (definition.expectedUnderlyingType !== value.underlyingType) {
      errors.push({
        message: `Expected scalar value to be ${definition.expectedUnderlyingType}, but received ${value.underlyingType}`,
        path,
      });
    }
  }

  return { errors };
}

import { Value, ValueKind } from "./ast";

interface OutputDependency {
  projectId?: string;
  environmentId?: string;
  resourceId: string;
  outputName: string;
}

/**
 * Returns all resource IDs a value depends on.
 * @param value
 */
export function resolveDependencies(value: Value): OutputDependency[] {
  if (value.kind === "output") {
    return [
      {
        projectId: value.projectId,
        environmentId: value.environmentId,
        resourceId: value.resourceId,
        outputName: value.outputName,
      },
    ];
  }

  switch (value.kind) {
    case ValueKind.List:
      return value.values.flatMap((v) => resolveDependencies(v));
    case ValueKind.Map:
      return value.fields.flatMap((f) => resolveDependencies(f));
    case ValueKind.Object:
      return value.fields.flatMap((f) => resolveDependencies(f));
    case ValueKind.Function:
      return value.argumentValues.flatMap((p) => resolveDependencies(p));
    case ValueKind.Field:
      return resolveDependencies(value.value);
    case ValueKind.FunctionArgument:
      return resolveDependencies(value.value);
    case ValueKind.Scalar:
      return [];
    case ValueKind.Configuration:
      return [];
  }
}

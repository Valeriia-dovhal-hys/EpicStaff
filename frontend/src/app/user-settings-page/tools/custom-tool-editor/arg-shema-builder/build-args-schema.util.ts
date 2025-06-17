// build-args-schema.util.ts

import { ArgsSchema } from '../models/python-code-tool.model';

/**
 * Builds an ArgsSchema object from the provided code and variables.
 */
export function buildArgsSchema(
  pythonCode: string,
  variables: Array<{ name: string; description: string }>
): ArgsSchema {
  const argsSchema: ArgsSchema = {
    title: 'ArgumentsSchema',
    type: 'object',
    properties: {},
  };

  // Extract parameters from the main() function using regex.
  const mainRegex = /def\s+main\s*\(([^)]*)\)/;
  const match = pythonCode.match(mainRegex);
  const paramMapping = new Map<string, string>();

  if (match && match[1]) {
    const params = match[1]
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p !== '');
    params.forEach((param) => {
      const parts = param.split(':');
      if (parts.length >= 2) {
        const paramName = parts[0].trim();
        let paramTypeRaw = parts[1].trim().replace(/,$/, '');
        // Map 'int' to 'integer' and 'str' to 'string'
        let finalType: string;
        if (paramTypeRaw === 'int') {
          finalType = 'integer';
        } else if (paramTypeRaw === 'str') {
          finalType = 'string';
        } else {
          finalType = 'string';
        }
        paramMapping.set(paramName, finalType);
      }
    });
  }

  // Create schema properties from the variables list.
  for (const variable of variables) {
    // Only add variables that have a valid (non-empty) name.
    if (!variable.name.trim()) {
      continue;
    }
    const varType = paramMapping.get(variable.name) || 'string';
    argsSchema.properties[variable.name] = {
      type: varType,
      description: variable.description,
    };
  }

  return argsSchema;
}
export function buildArgsSchemaFromVariables(
  variables: Array<{ name: string; description: string; type: string }>
): ArgsSchema {
  const argsSchema: ArgsSchema = {
    title: 'ArgumentsSchema',
    type: 'object',
    properties: {},
  };

  variables.forEach((variable) => {
    if (!variable.name.trim()) {
      return;
    }
    // Ensure that type is either 'string' or 'number', default to 'string' if invalid.
    const varType =
      variable.type === 'number' || variable.type === 'string'
        ? variable.type
        : 'string';

    argsSchema.properties[variable.name] = {
      type: varType,
      description: variable.description || '',
    };
  });

  return argsSchema;
}

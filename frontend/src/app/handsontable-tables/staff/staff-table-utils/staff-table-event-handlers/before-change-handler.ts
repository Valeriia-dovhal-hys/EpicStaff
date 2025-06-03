import Handsontable from 'handsontable';
import { SharedSnackbarService } from '../../../../services/snackbar/shared-snackbar.service';

export function beforeChangeHandler(
  changes: Array<Handsontable.CellChange | null>,
  source: Handsontable.ChangeSource,
  snackbarService: SharedSnackbarService
): boolean | void {
  if (!changes || changes.length === 0) {
    return;
  }

  const inspectedSources = ['CopyPaste.paste', 'Autofill.fill'];

  if (inspectedSources.includes(source)) {
    for (let i = changes.length - 1; i >= 0; i--) {
      const change: Handsontable.CellChange | null = changes[i];

      if (!change) {
        continue;
      }

      const [row, prop, oldValue, newValue] = change;

      if (typeof prop !== 'string') {
        continue;
      }

      switch (prop) {
        case 'agent_llm':
        case 'function_llm': {
          // Block any changes to 'agent_llm' and 'function_llm'
          changes.splice(i, 1);
          break;
        }
        case 'temperature':
        case 'max_iter': {
          // For numeric columns, allow only numeric values
          const parsedValue: number = parseFloat(newValue as string);
          if (isNaN(parsedValue)) {
            // Block the change if the new value is not a number
            changes.splice(i, 1);
            snackbarService.showSnackbar(
              `Invalid value for ${prop} at row ${
                Number(row) + 1
              }. Must be a number.`,
              'error'
            );
          } else {
            // Allow the change and ensure the value is a number
            change[3] = parsedValue;
          }
          break;
        }
        case 'allowDelegation':
        case 'verbose':
        case 'memory': {
          // For checkbox columns, allow only valid true or false values
          if (isValidCheckboxValue(newValue)) {
            // Convert the new value to a boolean
            change[3] = newValue;
          } else {
            // Block the change if the new value is invalid
            changes.splice(i, 1);
            snackbarService.showSnackbar(
              `Invalid value for ${prop} at row ${
                Number(row) + 1
              }. Must be true or false.`,
              'error'
            );
          }
          break;
        }
        default:
          // For other columns, no action needed (allow the change)
          break;
      }
    }
  }
}

// Helper functions

function isValidCheckboxValue(value: any): boolean {
  const lowerValue: string = value.toLowerCase();
  return ['true', 'false'].includes(lowerValue);
}

function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  } else if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1';
  } else if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

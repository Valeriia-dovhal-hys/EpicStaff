import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../../../services/snackbar/shared-snackbar.service';
import { LLM_Model } from '../../../../shared/models/LLM.model';

export function createBeforeChangeHandler(
  snackbarService: SharedSnackbarService,
  llmModels: LLM_Model[]
) {
  // Precompute a Set for faster lookup
  const llmModelNamesSet = new Set(
    llmModels.map((model) => model.name.toLowerCase())
  );

  return function (
    changes: Array<Handsontable.CellChange | null>,
    source: Handsontable.ChangeSource
  ): boolean | void {
    if (!changes || changes.length === 0) {
      return;
    }

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
        case 'llm_model_name':
        case 'fcm_llm_model_name': {
          if (
            typeof newValue !== 'string' ||
            !llmModelNamesSet.has(newValue.toLowerCase())
          ) {
            // Block the change if the newValue is not in llmModels
            changes.splice(i, 1);
            snackbarService.showSnackbar(
              `Invalid value for "${prop}" at row ${
                Number(row) + 1
              }. Must be a valid LLM model name.`,
              'warn'
            );
          }
          break;
        }
        case 'llm_temperature':
        case 'max_iter':
        case 'llm_context': {
          const parsedValue: number = parseFloat(newValue as string);
          if (isNaN(parsedValue)) {
            changes.splice(i, 1);
            snackbarService.showSnackbar(
              `Invalid value for "${prop}" at row ${
                Number(row) + 1
              }. Must be a number.`,
              'warn'
            );
          }
          break;
        }
        case 'allow_delegation':
        case 'memory': {
          // For checkbox columns, allow only valid true or false values
          if (isValidCheckboxValue(newValue)) {
            break;
          } else {
            // Block the change if the new value is invalid
            changes.splice(i, 1);
            snackbarService.showSnackbar(
              `Invalid value for "${prop}" at row ${
                Number(row) + 1
              }. Must be true or false.`,
              'warn'
            );
          }
          break;
        }
        default:
          break;
      }
    }
  };
}

// Helper function
function isValidCheckboxValue(value: any): boolean {
  if (typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return ['true', 'false'].includes(lowerValue);
  }
  return false;
}

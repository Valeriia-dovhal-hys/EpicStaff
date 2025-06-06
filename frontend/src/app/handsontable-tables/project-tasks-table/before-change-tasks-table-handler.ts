import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';

export function createBeforeChangeHandler(
  snackbarService: SharedSnackbarService
) {
  return function (
    changes: Array<Handsontable.CellChange | null>,
    source: any
  ): boolean | void {
    if (!changes || changes.length === 0) {
      return;
    }

    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];

      if (!change) {
        continue;
      }

      const [row, prop, oldValue, newValue] = change;

      if (typeof prop !== 'string') {
        continue;
      }

      switch (prop) {
        case 'order': {
          const parsedValue = parseFloat(newValue as string);
          if (isNaN(parsedValue)) {
            // Block the change
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
        case 'assignedAgentRole': {
          // Allow changes only if the source is 'customDropdown'
          if (source !== 'customDropdown') {
            // Block the change
            changes.splice(i, 1);
            snackbarService.showSnackbar(
              `Modification of "${prop}" is not allowed at row ${
                Number(row) + 1
              }.`,
              'warn'
            );
          }
          // Else, allow the change
          break;
        }
        default:
          // For other properties, allow the change
          break;
      }
    }
  };
}

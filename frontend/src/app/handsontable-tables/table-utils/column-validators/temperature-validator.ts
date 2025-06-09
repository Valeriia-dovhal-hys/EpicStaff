import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateTemperatureField(
  snackbarService: SharedSnackbarService
) {
  return function (
    this: Handsontable.CellProperties,
    value: number,
    callback: (valid: boolean) => void
  ): void {
    const row = this.row + 1;
    const columnName = this.prop as string;

    // Check if the value is empty
    if (value === null) {
      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" must not be empty.`,
        'error'
      );
      callback(false);
      return;
    }

    const isValid = !isNaN(value) && value >= 0 && value <= 1;

    if (isValid) {
      callback(true);
    } else {
      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" must be a number between 0 and 1.`,
        'error'
      );
      callback(false);
    }
  };
}

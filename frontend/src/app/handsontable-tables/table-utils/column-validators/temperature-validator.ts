// temperature-validator.ts

import Handsontable from 'handsontable';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateTemperatureField(
  snackbarService: SharedSnackbarService
) {
  return function (
    this: Handsontable.CellProperties,
    value: any,
    callback: Function
  ): void {
    // Trim the value to remove any leading/trailing whitespace
    const trimmedValue = String(value).trim();

    // Use a regular expression to test for a valid number between 0 and 1
    const isNumeric = /^-?\d+(\.\d+)?$/.test(trimmedValue);

    // Parse the value to a number
    const numValue = parseFloat(trimmedValue);

    // Check if the value is a valid number between 0 and 1
    const isValid =
      isNumeric && !isNaN(numValue) && numValue >= 0 && numValue <= 1;

    if (isValid) {
      callback(true);
    } else {
      const row = this.row + 1;
      const columnName = this.prop as string;

      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" must be a number between 0 and 1.`,
        'error'
      );

      callback(false);
    }
  };
}

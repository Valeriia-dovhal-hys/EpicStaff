// validate-is-number-field.ts

import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateIsNumberField(snackbarService: SharedSnackbarService) {
  return function (
    this: Handsontable.CellProperties,
    value: any,
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

    const isValid = !isNaN(value);

    if (isValid) {
      callback(true);
    } else {
      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" must be a valid number.`,
        'error'
      );
      callback(false);
    }
  };
}

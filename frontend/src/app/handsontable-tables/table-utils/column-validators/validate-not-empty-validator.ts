// validators.ts
import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateNotEmpty(snackbarService: SharedSnackbarService) {
  return function (
    this: Handsontable.CellProperties,
    value: any,
    callback: Function
  ): void {
    const isFieldNotEmpty: boolean =
      typeof value === 'string' && value.trim() !== '';

    if (isFieldNotEmpty) {
      callback(true);
    } else {
      const row = this.row + 1;
      const columnName = this.prop;

      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" should not be empty!`,
        'error'
      );

      callback(false);
    }
  };
}

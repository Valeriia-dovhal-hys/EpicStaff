// validators.ts
import Handsontable from 'handsontable';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateNotEmpty(snackbarService: SharedSnackbarService) {
  return function (
    this: Handsontable.CellProperties,
    value: string,
    callback: Function
  ): void {
    const isFieldNotEmpty: boolean = value.trim() !== '';

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

// validators.ts
import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateNotEmpty(snackbarService: SharedSnackbarService) {
  return function (
    this: Handsontable.CellProperties,
    value: any,
    callback: Function
  ): void {
    if (typeof value === 'string' && value.trim() !== '') {
      callback(true);
    } else {
      snackbarService.showSnackbar(
        `Row ${this.row + 1}, Column "${this.prop}" should not be empty!`,
        'error'
      );
      callback(false);
    }
  };
}

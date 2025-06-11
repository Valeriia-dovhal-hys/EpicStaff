import Handsontable from 'handsontable/base';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateUniqueRole(snackbarService: SharedSnackbarService) {
  return function (
    this: Handsontable.CellProperties,
    value: any,
    callback: Function
  ): void {
    const isFieldNotEmpty: boolean =
      typeof value === 'string' && value.trim() !== '';

    if (!isFieldNotEmpty) {
      const row = this.row + 1;
      const columnName = this.prop;

      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" should not be empty!`,
        'error'
      );

      callback(false);
      return;
    }

    const currentRowIndex = this.row;

    const allRoles = this.instance.getDataAtProp('role');

    const duplicateExists = allRoles.some((otherValue: any, index: number) => {
      if (index === currentRowIndex) return false;
      if (typeof otherValue !== 'string' || otherValue.trim() === '')
        return false;
      return otherValue.trim() === value.trim();
    });

    if (duplicateExists) {
      const row = currentRowIndex + 1;
      const columnName = this.prop;

      snackbarService.showSnackbar(
        `Row ${row}, Column "${columnName}" must be unique!`,
        'error'
      );

      callback(false);
    } else {
      callback(true);
    }
  };
}

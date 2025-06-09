// validate-tools-field.ts

import Handsontable from 'handsontable';
import { Tool } from '../../../shared/models/tool.model';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';

export function validateToolsField(
  toolsData: Tool[],
  snackbarService: SharedSnackbarService
) {
  return function (
    this: Handsontable.CellProperties,
    value: string,
    callback: Function
  ): void {
    // const isFieldEmpty: boolean = value.trim() === '';

    // if (isFieldEmpty) {
    //   callback(true);
    //   return;
    // }

    const toolTitles = value.split(',').map((title: string) => title.trim());

    // Check for extra comma
    const hasEmptyTitle = toolTitles.includes('');

    const invalidTitles: string[] = toolTitles.filter(
      (title) => !toolsData.some((tool: Tool) => tool.name === title)
    );

    if (invalidTitles.length === 0) {
      callback(true);
    } else {
      snackbarService.showSnackbar(
        `The following tools are invalid: ${invalidTitles.join(', ')}`,
        'error'
      );
      callback(false);
    }
  };
}

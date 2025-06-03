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
    value: string | null | undefined,
    callback: Function
  ): void {
    if (value == null) {
      callback(true);
      return;
    }

    const isFieldEmpty: boolean = value.trim() === '';

    if (isFieldEmpty) {
      // Decide whether empty strings are valid or not
      // For example, if the field is required:
      snackbarService.showSnackbar(`Tools field cannot be empty.`, 'error');
      callback(false);
      return;
    }

    const toolTitles: string[] = value
      .split(',')
      .map((title: string) => title.trim());

    // Check for extra comma resulting in an empty title
    const hasEmptyTitle: boolean = toolTitles.includes('');

    if (hasEmptyTitle) {
      snackbarService.showSnackbar(
        `Tools field contains invalid format.`,
        'error'
      );
      callback(false);
      return;
    }

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

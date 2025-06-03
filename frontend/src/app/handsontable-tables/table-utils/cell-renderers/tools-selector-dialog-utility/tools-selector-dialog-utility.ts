import Handsontable from 'handsontable';
import { MatDialog } from '@angular/material/dialog';

import { ToolSelectorComponent } from '../../../../main/tools-selector-dialog/tool-selector-dialog.component';
import { Tool } from '../../../../shared/models/tool.model';

//global Variables, maybe good maybe not
let lastClickTime: number = 0;
const doubleClickThreshold: number = 300;

//CHECKS FOR ENTER PRESSED
export function handleBeforeKeyDown(
  event: KeyboardEvent,
  hotInstance: Handsontable.Core,
  dialog: MatDialog,
  targetColumnName: string,
  toolsData: Tool[]
): void {
  if (event.key === 'Enter') {
    const selected: [number, number, number, number][] | undefined =
      hotInstance.getSelected();

    // Check if no dialogs are open
    if (selected && dialog.openDialogs.length === 0) {
      // selection must begin from the target column
      const [startRow, startCol] = selected[0];

      const colHeaders = hotInstance.getSettings().colHeaders as string[];

      const columnName: string = colHeaders[startCol];

      if (columnName === targetColumnName) {
        const cellValue = hotInstance.getDataAtCell(startRow, startCol);
        openDialog(
          cellValue,
          { row: startRow, col: startCol },
          dialog,
          hotInstance,
          toolsData
        );
      }
    }
  }
}

//CHECKS FOR DOUBLE CLICK
export function handleAfterOnCellMouseDown(
  coords: Handsontable.CellCoords,
  hotInstance: Handsontable.Core,
  dialog: MatDialog,
  targetColumnName: string,
  toolsData: Tool[]
): void {
  const colHeaders = hotInstance.getSettings().colHeaders as string[];
  const clickedColumnName: string = colHeaders[coords.col];

  if (clickedColumnName === targetColumnName) {
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - lastClickTime;

    if (
      timeSinceLastClick < doubleClickThreshold &&
      dialog.openDialogs.length === 0
    ) {
      const cellValue = hotInstance.getDataAtCell(coords.row, coords.col);
      openDialog(cellValue, coords, dialog, hotInstance, toolsData);
    }

    lastClickTime = currentTime;
  }
}

// OPENS DIALOG
function openDialog(
  cellValue: string,
  coords: { row: number; col: number },
  dialog: MatDialog,
  hotInstance: Handsontable.Core,
  toolsData: Tool[]
): void {
  const dialogRef = dialog.open(ToolSelectorComponent, {
    data: { toolsTitles: cellValue, toolsData: toolsData },
    width: '45vw',
    maxWidth: 'none',
    // height: '60%',
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result !== undefined) {
      hotInstance.setDataAtCell(coords.row, coords.col, result);
    }
  });
}

//THIS PREVENTS SELECTION OF ANOTHER CELL WHEN WE PRESS ENTER ON A CELL FROM THE TARGET COLUMN
export function handleEnterMoves(
  hotInstance: Handsontable.Core,
  targetColumnName: string
): {
  row: number;
  col: number;
} {
  const selected: [number, number, number, number][] | undefined =
    hotInstance.getSelected();

  if (selected) {
    const [startRow, startCol] = selected[0];
    const colHeaders = hotInstance.getSettings().colHeaders as string[];
    const columnName = colHeaders[startCol];

    if (columnName === targetColumnName) {
      // Prevent movement in TargetColumn
      return { row: 0, col: 0 };
    }
  }
  // Default movement for other columns
  return { row: 1, col: 0 };
}

// tables_uni_utils.ts
import Handsontable from 'handsontable';
import { Agent } from '../../shared/models/agent.model';
import { Task } from '../../shared/models/task.model';

export type RowObjectTask = Task;
export type RowObjectAgent = Agent;

export type ChangeSource =
  | 'edit'
  | 'loadData'
  | 'autofill'
  | 'copyPaste'
  | 'undo'
  | 'redo'
  | 'external'
  | 'persistentState'
  | 'customDropdown'
  | string;

export type ChangeTask = [
  row: number,
  prop: string | number | ((rowData: RowObjectTask, prop: string) => any),
  oldValue: any,
  newValue: any
];

export type ChangeAgent = [
  row: number,
  prop: string | number | ((rowData: RowObjectAgent, prop: string) => any),
  oldValue: any,
  newValue: any
];

export function getInvalidRows(hotInstance: Handsontable.Core): number[] {
  const rowsCount: number = hotInstance.countRows();
  const colsCount: number = hotInstance.countCols();
  const invalidRows: Set<number> = new Set<number>();

  for (let row = 0; row < rowsCount; row++) {
    for (let col = 0; col < colsCount; col++) {
      const cellMeta = hotInstance.getCellMeta(row, col);
      if (cellMeta.valid === false) {
        invalidRows.add(row);
        break; // No need to check other columns for this row
      }
    }
  }

  return Array.from(invalidRows);
}

export function isRowValid(row: number, hotInstance: Handsontable): boolean {
  const totalColumns = hotInstance.countCols();

  for (let col = 0; col < totalColumns; col++) {
    const cellMeta = hotInstance.getCellMeta(row, col);
    if (cellMeta.valid === false) {
      return false;
    }
  }
  return true;
}

// testtable.component.ts
import {
  Component,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Inject,
} from '@angular/core';
import Handsontable from 'handsontable';
import { MatDialog } from '@angular/material/dialog';
import {
  handleBeforeKeyDown,
  handleAfterOnCellMouseDown,
  handleEnterMoves,
} from '../../handsontable-tables/table-utils/cell-renderers/tools-selector-dialog-utility/tools-selector-dialog-utility';
import { DOCUMENT } from '@angular/common';
import { Tool } from '../../shared/models/tool.model';
import { ToolSelectorComponent } from '../tools-selector-dialog/tool-selector-dialog.component';

@Component({
  selector: 'app-testtable',
  standalone: true,
  templateUrl: './testtable.component.html',
  styleUrls: ['./testtable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Enable OnPush change detection
})
export class TesttableComponent implements AfterViewInit {
  @ViewChild('hotContainer', { static: false }) hotContainer!: ElementRef;

  private hotInstance!: Handsontable.Core;
  private readonly targetColumnName: string = 'TargetColumn';
  toolsData = [
    {
      id: '1',
      title: 'BrowserbaseLoadTool',
      authorName: 'Author Name 1',
    },
    {
      id: '2',
      title: 'YoutubeSearchTool',
      authorName: 'Author Name 2',
    },
    {
      id: '3',
      title: 'GithubSearchTool',
      authorName: 'Author Name 3',
    },
  ];

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  hotSettings: Handsontable.GridSettings = {
    stretchH: 'all',
    data: [
      ['A1', 'B1', 'BrowserbaseLoadTool, YoutubeSearchTool'],
      ['A2', 'B2', 'C2'],
    ],
    colHeaders: ['Column1', 'Column2', 'TargetColumn'],
    colWidths: [100, 100, 400],
    rowHeaders: true,
    columns: [
      {}, // For Column1
      {}, // For Column2
      {
        // readOnly: true,
      },
    ],

    beforeBeginEditing: (row: number, column: number): void | boolean => {
      const colHeaders = this.hotInstance.getColHeader() as string[];
      const columnName = colHeaders[column];

      if (columnName === this.targetColumnName) {
        this.openDialogAtCell(row, column);
        return false; // Prevent the default editor from opening
      }
    },
    // enterMoves: (event: KeyboardEvent) =>
    //   handleEnterMoves(this.hotInstance, this.targetColumnName),

    // beforeKeyDown: (event: KeyboardEvent) =>
    //   handleBeforeKeyDown(
    //     event,
    //     this.hotInstance,
    //     this.dialog,
    //     this.targetColumnName,
    //     this.toolsData
    //   ),
    // afterOnCellMouseDown: (
    //   event: MouseEvent,
    //   coords: Handsontable.CellCoords,
    //   TD: HTMLTableCellElement
    // ) =>
    //   handleAfterOnCellMouseDown(
    //     coords,
    //     this.hotInstance,
    //     this.dialog,
    //     this.targetColumnName,
    //     this.toolsData
    //   ),
  };

  openDialogAtCell(row: number, column: number) {
    const cellValue = this.hotInstance.getDataAtCell(row, column);
    // Deselect the table
    this.hotInstance.deselectCell();
    const dialogRef = this.dialog.open(ToolSelectorComponent, {
      data: { toolsTitles: cellValue, toolsData: this.toolsData },
      width: '45vw',
      maxWidth: 'none',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.hotInstance.setDataAtCell(row, column, result);
      }
    });
  }
  ngAfterViewInit() {
    if (this.hotContainer) {
      this.hotInstance = new Handsontable(
        this.hotContainer.nativeElement,
        this.hotSettings
      );
    } else {
      console.error('Container element not found!');
    }
  }
}

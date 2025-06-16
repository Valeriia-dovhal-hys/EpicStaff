import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';

import Handsontable from 'handsontable/base';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mutual_Variables_RowResize_Renderer } from '../../handsontable-tables/table-utils/cell-renderers/variables-cell-renderer/mutual_variables-manualresize-renderer-utility';
import { VariablePopupComponent } from './popup/popup.component';

interface Variable {
  title: string;
  value: string;
}

interface DataItem {
  id: number;
  name: string;
  value: string;
}

interface PopupConfig {
  variables?: Variable[];
  position: { top: number; left: number };
  show: boolean;
}

@Component({
  selector: 'app-variables',
  standalone: true,
  imports: [CommonModule, FormsModule, VariablePopupComponent],
  templateUrl: './variables.component.html',
  styleUrls: ['./variables.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariablesComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('hotTable', { static: true }) hotTable!: ElementRef;
  @ViewChild(VariablePopupComponent)
  variablePopupComponent!: VariablePopupComponent;

  @Input() variables?: Variable[] = [
    {
      title: 'City',
      value: 'Paris',
    },
  ]; // Optional variables input

  dataSource: DataItem[] = [
    {
      id: 1,
      name: 'Item 1',
      value: 'Some text with {Variable1} and more text',
    },
    { id: 2, name: 'Item 2', value: '{Variable2} in the middle' },
    { id: 3, name: 'Item 3', value: 'No variables here' },
    // ... (additional data items)
  ];

  hot!: Handsontable.Core;
  showPopup = false;
  popupPosition = { top: 0, left: 0 };
  currentEditorInput: HTMLTextAreaElement | null = null;
  isEditing = false;
  cursorPosition: number = 0;
  listenersAttached = false;

  private pattern: RegExp = /$^/; // Initialize with a regex that matches nothing
  private cache: Map<string, DocumentFragment>;

  private unsubscribeEditorListeners: (() => void) | null = null;

  // Define the popup configuration object
  popupConfig: PopupConfig = {
    variables: [
      {
        title: 'City',
        value: 'Paris',
      },
    ], // Will be set in ngOnChanges
    position: { top: 0, left: 0 },
    show: false,
  };

  constructor(private cdr: ChangeDetectorRef) {
    this.cache = new Map<string, DocumentFragment>();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['variables']) {
      this.initializePattern();
      // Reassign popupConfig to a new object to trigger OnPush change detection
      this.popupConfig = {
        variables:
          this.variables && this.variables.length > 0 ? this.variables : [],
        position: this.popupConfig.position,
        show: this.popupConfig.show,
      };
      console.log('Popup Config Variables:', this.popupConfig.variables);
    }
  }

  private initializePattern() {
    const vars =
      this.variables && this.variables.length > 0 ? this.variables : [];

    if (vars && vars.length > 0) {
      // Escape each variable title for safe use in regex
      const escapedVariableTitles = vars.map((variable) =>
        variable.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );

      // Create a regex that matches any {VariableTitle} where VariableTitle is from the variables array
      this.pattern = new RegExp(
        `\\{(${escapedVariableTitles.join('|')})\\}`,
        'g'
      );
    } else {
      // If no variables, create a pattern that matches nothing
      this.pattern = /$^/; // Matches nothing
    }
  }

  ngAfterViewInit() {
    this.initializePattern(); // Ensure pattern is initialized

    this.hot = new Handsontable(this.hotTable.nativeElement, {
      data: this.dataSource,
      contextMenu: true,
      stretchH: 'last',
      colHeaders: ['ID', 'Name', 'Value'],
      rowHeaders: true,
      width: '100%',
      height: '100%',
      wordWrap: true,
      rowHeights: 150,
      manualColumnResize: true,
      manualRowResize: true,
      licenseKey: 'non-commercial-and-evaluation',
      colWidths: [100, 100, 100],
      columns: [
        {
          data: 'id',
          readOnly: false,
          renderer: (instance, td, row, col, prop, value, cellProperties) =>
            mutual_Variables_RowResize_Renderer(
              instance,
              td,
              row,
              col,
              prop,
              value,
              cellProperties,
              this.cache,
              this.pattern
            ),
        },
        {
          data: 'name',
          readOnly: false,
          renderer: (instance, td, row, col, prop, value, cellProperties) =>
            mutual_Variables_RowResize_Renderer(
              instance,
              td,
              row,
              col,
              prop,
              value,
              cellProperties,
              this.cache,
              this.pattern
            ),
        },
        {
          data: 'value',
          readOnly: false,
          renderer: (instance, td, row, col, prop, value, cellProperties) =>
            mutual_Variables_RowResize_Renderer(
              instance,
              td,
              row,
              col,
              prop,
              value,
              cellProperties,
              this.cache,
              this.pattern
            ),
        },
      ],

      afterBeginEditing: () => {
        this.afterBeginEditing();
      },

      beforeKeyDown: (event) => {
        if (event.key === 'Escape') {
          this.isEditing = false;
          this.hidePopup();
          this.removeEditorListeners();
        }
      },
      afterChange: (changes, source) => {
        if (this.isEditing && source === 'edit') {
          this.isEditing = false;
          this.hidePopup();
          this.removeEditorListeners();
        }
      },
    });
  }

  afterBeginEditing() {
    // Always remove previous listeners
    this.removeEditorListeners();

    this.isEditing = true;
    const editor =
      this.hot.getActiveEditor() as Handsontable.editors.TextEditor;
    const input = editor.TEXTAREA as HTMLTextAreaElement;
    if (input) {
      const keyupListener = (event: KeyboardEvent) => this.onEditorKeyup(event);
      const clickListener = (event: MouseEvent) => this.onEditorClick(event);
      const mouseupListener = (event: MouseEvent) => this.onEditorClick(event);

      input.addEventListener('keyup', keyupListener);
      input.addEventListener('click', clickListener);
      input.addEventListener('mouseup', mouseupListener);

      // Store unsubscribe function
      this.unsubscribeEditorListeners = () => {
        this.currentEditorInput = null;
        input.removeEventListener('keyup', keyupListener);
        input.removeEventListener('click', clickListener);
        input.removeEventListener('mouseup', mouseupListener);
      };
      this.currentEditorInput = input;
      this.listenersAttached = true;
    }
  }

  onEditorKeyup = (event: KeyboardEvent) => {
    if (this.currentEditorInput) {
      const input = this.currentEditorInput;
      this.cursorPosition = input.selectionStart || 0; // Save the cursor position
      const textBeforeCursor = input.value.substring(0, this.cursorPosition);

      if (textBeforeCursor.endsWith('{')) {
        this.showPopup = true;
        this.cdr.detectChanges();

        // Defer execution to ensure the popup is rendered
        setTimeout(() => {
          const inputRect = input.getBoundingClientRect();

          // Access the popup's dimensions
          const popupElement =
            this.variablePopupComponent.popupElement.nativeElement;
          const popupWidth = popupElement.offsetWidth;
          const popupHeight = popupElement.offsetHeight;

          const gap = 5; // Gap between the popup and textarea

          let popupLeft = inputRect.left;
          let popupTop = inputRect.top - popupHeight - gap;

          if (popupTop < gap) {
            popupTop = inputRect.bottom + gap;
          }

          if (popupLeft + popupWidth > window.innerWidth - gap) {
            popupLeft = window.innerWidth - popupWidth - gap;
            if (popupLeft < gap) {
              popupLeft = gap;
            }
          }

          this.popupPosition = { top: popupTop, left: popupLeft };

          // Reassign popupConfig to trigger change detection
          this.popupConfig = {
            variables: this.popupConfig.variables,
            position: { top: popupTop, left: popupLeft },
            show: true,
          };

          this.cdr.detectChanges();
        }, 0);
      } else {
        if (this.showPopup) {
          this.hidePopup();
        }
      }
    }
  };

  onEditorClick = (event: MouseEvent) => {
    if (this.currentEditorInput) {
      const input: HTMLTextAreaElement = this.currentEditorInput;
      this.cursorPosition = input.selectionStart || 0;
    }
  };

  insertVariable(variableTitle: string): void {
    if (this.currentEditorInput) {
      const input = this.currentEditorInput;
      input.focus(); // Ensure the input has focus

      const cursorPosition = input.selectionStart || this.cursorPosition || 0;
      const value = input.value;

      // Find the position of '{' before the cursor
      const braceIndex = value.lastIndexOf('{', cursorPosition - 1);
      if (braceIndex !== -1) {
        // Get text before '{' (excluding '{')
        const textBeforeBrace = value.substring(0, braceIndex);
        const textAfterCursor = value.substring(cursorPosition);

        // Insert '{' + variable title + '}'
        const newValue =
          textBeforeBrace + `{${variableTitle}}` + textAfterCursor;
        input.value = newValue;

        // Update the cursor position
        const newCursorPosition = braceIndex + variableTitle.length + 2; // +2 for '{' and '}'
        input.setSelectionRange(newCursorPosition, newCursorPosition);

        // Trigger input event to update Handsontable's value
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);

        // Hide the popup
        this.hidePopup();
      }
    }
  }

  hidePopup() {
    if (this.showPopup) {
      this.showPopup = false;
      this.popupConfig = {
        variables: this.popupConfig.variables,
        position: this.popupConfig.position,
        show: false,
      };
      console.log('Hiding popup');
      this.cdr.markForCheck();
    }
  }

  onVariableSelected(variableTitle: string) {
    this.insertVariable(variableTitle);
  }

  removeEditorListeners() {
    if (this.unsubscribeEditorListeners) {
      this.unsubscribeEditorListeners();
      this.unsubscribeEditorListeners = null;
      this.listenersAttached = false;
    }
    this.currentEditorInput = null;
  }

  ngOnDestroy() {
    this.removeEditorListeners();
  }
}

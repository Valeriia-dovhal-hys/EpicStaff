import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ResizableDirective } from '../directives/resizable.directive';

@Component({
  selector: 'app-code-editor',
  imports: [FormsModule, NgIf, MonacoEditorModule, ResizableDirective],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  @Input() public pythonCode: string = '';
  /**
   * Allow the parent to override the default height.
   * Defaults to 200 if none is passed in.
   */
  @Input() public editorHeight: number = 200;

  public editorLoaded = false;
  @Output() public errorChange = new EventEmitter<boolean>();

  private monacoEditor: any;
  public showMainError = false;

  public editorOptions = {
    theme: 'vs-dark',
    language: 'python',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  };

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  public onCodeChange(newValue: string): void {
    const mainRegex = /(^|\n)\s*def\s+main\b/;
    this.showMainError = !mainRegex.test(newValue);
    this.errorChange.emit(this.showMainError);
    this.cdr.markForCheck();
  }

  public onEditorInit(editor: any): void {
    this.editorLoaded = true;
    this.monacoEditor = editor;
    this.cdr.markForCheck();
  }

  /**
   * Called by the resizable directive whenever the user drags the resize handle.
   */
  public onResize(newHeight: number): void {
    this.editorHeight = newHeight;
    if (this.monacoEditor && typeof this.monacoEditor.layout === 'function') {
      this.monacoEditor.layout();
    }
  }

  public copyCode(): void {
    navigator.clipboard.writeText(this.pythonCode).catch(() => {});
  }
}

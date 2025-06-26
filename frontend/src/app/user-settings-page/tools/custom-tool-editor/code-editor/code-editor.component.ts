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
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';

@Component({
  selector: 'app-code-editor',
  imports: [FormsModule, NgIf, MonacoEditorModule, AppIconComponent],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class CodeEditorComponent {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  @Input() public pythonCode: string = '';
  @Output() public pythonCodeChange = new EventEmitter<string>();
  @Output() public errorChange = new EventEmitter<boolean>();

  private monacoEditor: any;
  public editorLoaded = false;
  public showMainError = false;

  public editorOptions = {
    theme: 'vs-dark',
    language: 'python',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    wrappingIndent: 'indent',
    wordWrapMinified: true,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 4,
  };

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  public onCodeChange(newValue: string): void {
    const mainRegex = /(^|\n)\s*def\s+main\b/;
    this.showMainError = !mainRegex.test(newValue);
    this.errorChange.emit(this.showMainError);
    this.pythonCode = newValue;
    this.pythonCodeChange.emit(newValue);
    this.cdr.markForCheck();
  }

  public onEditorInit(editor: any): void {
    this.editorLoaded = true;
    this.monacoEditor = editor;

    // Set additional editor options after initialization
    if (this.monacoEditor) {
      this.monacoEditor.updateOptions({
        wordWrapBreakAfterCharacters: ',:',
        wordWrapBreakBeforeCharacters: '}])',
      });
    }

    this.cdr.markForCheck();
  }

  public copyCode(): void {
    navigator.clipboard.writeText(this.pythonCode).catch(() => {});
  }
}

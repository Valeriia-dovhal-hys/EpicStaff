import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { PythonNodeModel } from '../../../core/models/node.model';
import { ToolLibrariesComponent } from '../../../../user-settings-page/tools/custom-tool-editor/tool-libraries/tool-libraries.component';
import { CodeEditorComponent } from '../../../../user-settings-page/tools/custom-tool-editor/code-editor/code-editor.component';
import { NgIf, NgFor } from '@angular/common';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';
import { FlowService } from '../../../services/flow.service';

@Component({
  selector: 'app-python-side-panel',
  standalone: true,
  templateUrl: './python-side-panel.component.html',
  styleUrls: ['./python-side-panel.component.scss'],
  imports: [
    CodeEditorComponent,
    ToolLibrariesComponent,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    DragDropModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // Added OnPush strategy
})
export class PythonSidePanelComponent implements OnInit {
  @Input() node!: PythonNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<PythonNodeModel>();

  public pythonForm!: FormGroup;
  public codeEditorHasError: boolean = false;

  public pythonCode: string =
    'def main(arg1: str, arg2: str) -> dict:\n    return {\n        "result": arg1 + arg2,\n    }\n';

  @ViewChild(ToolLibrariesComponent)
  librariesComponent!: ToolLibrariesComponent;
  @ViewChild(CodeEditorComponent) codeEditorComponent!: CodeEditorComponent;

  constructor(private fb: FormBuilder, private flowService: FlowService) {}

  ngOnInit(): void {
    // Initialize the form with existing data
    this.pythonForm = this.fb.group({
      name: [this.node.data.name || '', Validators.required],
      node_name: [
        this.node.node_name,
        [
          Validators.required,
          uniqueNodeNameValidator(
            () =>
              this.flowService
                .nodes()
                .map((n) => n.node_name)
                .filter((name): name is string => !!name),
            this.node.node_name
          ),
        ],
      ],
      input_map: this.fb.array(this.initInputMapFormArray()),
      output_variable_path: [this.node.output_variable_path || ''],
    });

    // Initialize Python code
    if (this.node.data.code) {
      this.pythonCode = this.node.data.code;
    }
  }

  private initInputMapFormArray(): FormGroup[] {
    // Convert the input_map object to an array of key-value pairs
    if (!this.node.input_map || Object.keys(this.node.input_map).length === 0) {
      // If input_map is empty, return an array with one empty key-value pair
      return [this.createInputMapPairGroup('', '')];
    }

    return Object.entries(this.node.input_map).map(([key, value]) => {
      return this.createInputMapPairGroup(key, value);
    });
  }

  private createInputMapPairGroup(key: string, value: any): FormGroup {
    return this.fb.group({
      key: [key || ''],
      value: [value !== undefined ? value : ''],
    });
  }

  public get inputMapPairs(): FormArray {
    return this.pythonForm.get('input_map') as FormArray;
  }

  public addInputMapPair(): void {
    this.inputMapPairs.push(this.createInputMapPairGroup('', ''));
  }

  public removeInputMapPair(index: number): void {
    this.inputMapPairs.removeAt(index);
  }

  public dropInputMapPair(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.inputMapPairs.controls,
      event.previousIndex,
      event.currentIndex
    );
  }

  // Receives error state from the code editor component
  onCodeErrorChange(hasError: boolean): void {
    this.codeEditorHasError = hasError;
  }

  // Convert input_map form array to a key-value object
  private buildInputMapObject(): Record<string, any> {
    const inputMapObject: Record<string, any> = {};

    this.inputMapPairs.controls.forEach((control) => {
      const key = control.get('key')?.value;
      const value = control.get('value')?.value;
      // Only add the pair if the key is not empty (ignoring whitespace)
      if (key && key.trim() !== '') {
        inputMapObject[key.trim()] = value;
      }
    });

    return inputMapObject;
  }

  onSave(): void {
    if (this.pythonForm.valid && !this.codeEditorHasError) {
      const formValue = this.pythonForm.getRawValue();

      // Build the input_map object from the form array
      const inputMapObject = this.buildInputMapObject();

      const updatedNode: PythonNodeModel = {
        ...this.node,
        // Save the unique node name on the node object
        node_name: formValue.node_name,
        // Add the input_map as an object
        input_map: inputMapObject,
        output_variable_path: formValue.output_variable_path.trim() || null,
        data: {
          ...this.node.data,
          // Save the other name field inside node.data
          name: formValue.name,
          libraries: this.librariesComponent
            ? this.librariesComponent.libraries
            : [],
          code: this.codeEditorComponent
            ? this.codeEditorComponent.pythonCode
            : 'error code was not passed from the client',
          entrypoint: 'main',
        },
      };

      this.nodeUpdated.emit(updatedNode);
      this.close();
    }
  }

  close(): void {
    this.closePanel.emit();
  }
}

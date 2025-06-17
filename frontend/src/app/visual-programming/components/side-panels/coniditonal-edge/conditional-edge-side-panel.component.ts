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
import { EdgeNodeModel } from '../../../core/models/node.model';
import { ToolLibrariesComponent } from '../../../../user-settings-page/tools/custom-tool-editor/tool-libraries/tool-libraries.component';
import { CodeEditorComponent } from '../../../../user-settings-page/tools/custom-tool-editor/code-editor/code-editor.component';
import { NgIf, NgFor } from '@angular/common';
import { FlowService } from '../../../services/flow.service';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';

@Component({
  selector: 'app-conditional-edge-side-panel',
  standalone: true,
  templateUrl: './conditional-edge-side-panel.component.html',
  styleUrls: ['./conditional-edge-side-panel.component.scss'],
  imports: [
    CodeEditorComponent,
    ToolLibrariesComponent,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    DragDropModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalEdgeSidePanelComponent implements OnInit {
  @Input() node!: EdgeNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<EdgeNodeModel>();

  public conditionalEdgeForm!: FormGroup;
  public codeEditorHasError: boolean = false;

  // Initial Python code template
  public pythonCode: string =
    'def main(arg1: str, arg2: str) -> dict:\n    return {\n        "result": arg1 + arg2,\n    }\n';

  // Get references to child components
  @ViewChild(ToolLibrariesComponent)
  librariesComponent!: ToolLibrariesComponent;
  @ViewChild(CodeEditorComponent)
  codeEditorComponent!: CodeEditorComponent;

  constructor(private fb: FormBuilder, private flowService: FlowService) {}

  ngOnInit(): void {
    // Initialize the form with existing data
    this.conditionalEdgeForm = this.fb.group({
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
    return this.conditionalEdgeForm.get('input_map') as FormArray;
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
    if (!this.codeEditorHasError && this.conditionalEdgeForm.valid) {
      const formValue = this.conditionalEdgeForm.getRawValue();

      // Build the input_map object from the form array
      const inputMapObject = this.buildInputMapObject();

      const updatedNode: EdgeNodeModel = {
        ...this.node,
        // Update node_name using the form value
        node_name: formValue.node_name,
        // Add the input_map as an object and output_variable_path
        input_map: inputMapObject,
        output_variable_path: formValue.output_variable_path.trim() || null,
        data: {
          ...this.node.data,
          python_code: {
            libraries: this.librariesComponent
              ? this.librariesComponent.libraries
              : [],
            code: this.codeEditorComponent
              ? this.codeEditorComponent.pythonCode
              : '',
            entrypoint: 'main',
          },
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

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
  HostListener,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { EdgeNodeModel } from '../../../core/models/node.model';
import { ToolLibrariesComponent } from '../../../../user-settings-page/tools/custom-tool-editor/tool-libraries/tool-libraries.component';
import { CodeEditorComponent } from '../../../../user-settings-page/tools/custom-tool-editor/code-editor/code-editor.component';
import { FlowService } from '../../../services/flow.service';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InputMapComponent } from '../../../components/input-map/input-map.component';
import { CustomPythonCode } from '../../../../features/tools/models/python-code.model';
import { Dialog } from '@angular/cdk/dialog';
import { DialogModule } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/cofirm-dialog/confirmation-dialog.component';
import { SidePanelService } from '../../../services/side-panel.service';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';

interface InputMapPair {
  key: string;
  value: string;
}

// interface PythonCodeData {
//   name: string;
//   libraries: string[];
//   code: string;
//   entrypoint: string;
// }

@Component({
  selector: 'app-conditional-edge-side-panel',
  standalone: true,
  templateUrl: './conditional-edge-side-panel.component.html',
  styleUrls: ['./conditional-edge-side-panel.component.scss'],
  imports: [
    CodeEditorComponent,
    ToolLibrariesComponent,
    ReactiveFormsModule,
    DragDropModule,
    InputMapComponent,
    DialogModule,
    HelpTooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalEdgeSidePanelComponent implements OnInit, OnDestroy {
  @Input() public node!: EdgeNodeModel;
  @Output() private closePanel = new EventEmitter<void>();
  @Output() private nodeUpdated = new EventEmitter<EdgeNodeModel>();

  public readonly hasUnsavedChanges = signal<boolean>(false);

  public conditionalEdgeForm: FormGroup;
  public pythonCode: string = '';
  public codeEditorHasError: boolean = false;
  private initialFormValue: any;
  private initialPythonCode: string = '';

  private readonly destroy$ = new Subject<void>();
  private readonly DEFAULT_PYTHON_CODE =
    'def main(arg1: str, arg2: str) -> dict:\n    return {\n        "result": arg1 + arg2,\n    }\n';

  constructor(
    private readonly fb: FormBuilder,
    private readonly flowService: FlowService,
    private readonly dialog: Dialog,
    private readonly sidePanelService: SidePanelService
  ) {
    this.conditionalEdgeForm = this.initializeForm();
  }

  @HostListener('document:keydown.escape')
  public handleEscapeKey(): void {
    this.close();
  }

  public ngOnInit(): void {
    this.initializeFormValues();
    this.setupFormChangeTracking();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public get inputMapPairs(): FormArray {
    return this.conditionalEdgeForm.get('input_map') as FormArray;
  }

  public get activeColor(): string {
    return this.node?.color || '#685fff';
  }

  public close(): void {
    console.log(
      'close  panel triggered in conditional edge side panel',
      this.sidePanelService.getCurrentState()
    );

    this.sidePanelService.tryClosePanel().then((closed) => {
      if (closed) {
        console.log('close panel emitted in conditional edge side panel');
        this.closePanel.emit();
      }
    });
  }
  public onCodeErrorChange(hasError: boolean): void {
    this.codeEditorHasError = hasError;
  }

  public onPythonCodeChange(newCode: string): void {
    this.pythonCode = newCode;
    this.checkForChanges();
  }

  public onSave(): void {
    if (this.isFormValid()) {
      const inputMapValue = this.createInputMapFromPairs();
      const updatedNode = this.createUpdatedNode(inputMapValue);
      this.nodeUpdated.emit(updatedNode);
      this.hasUnsavedChanges.set(false);
      this.sidePanelService.setHasUnsavedChanges(false);
      this.conditionalEdgeForm.markAsPristine();
      this.initialFormValue = this.conditionalEdgeForm.getRawValue();
      this.initialPythonCode = this.pythonCode;
    }
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      node_name: ['', [Validators.required]],
      input_map: this.fb.array([]),
      output_variable_path: [''],
    });
  }

  private initializeFormValues(): void {
    if (this.node) {
      this.conditionalEdgeForm.patchValue({
        node_name: this.node.node_name,
        output_variable_path: this.node.output_variable_path,
      });

      this.pythonCode =
        this.node.data?.python_code?.code || this.DEFAULT_PYTHON_CODE;
      this.initialPythonCode = this.pythonCode;

      this.initializeInputMap();
      this.conditionalEdgeForm.markAsPristine();
      this.initialFormValue = this.conditionalEdgeForm.getRawValue();
      this.hasUnsavedChanges.set(false);
    }
  }

  private initializeInputMap(): void {
    if (this.node?.input_map && Object.keys(this.node.input_map).length > 0) {
      this.initializeExistingInputMap();
    } else {
      this.addEmptyInputMapPair();
    }
  }

  private initializeExistingInputMap(): void {
    Object.entries(this.node.input_map).forEach(([key, value]) => {
      this.inputMapPairs.push(
        this.fb.group({
          key: [key],
          value: [value],
        })
      );
    });
  }

  private addEmptyInputMapPair(): void {
    this.inputMapPairs.push(
      this.fb.group({
        key: [''],
        value: [''],
      })
    );
  }
  private setupFormChangeTracking(): void {
    // Track form changes
    this.conditionalEdgeForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkForChanges();
      });
  }

  private checkForChanges(): void {
    const formChanged = !this.isEqual(
      this.conditionalEdgeForm.getRawValue(),
      this.initialFormValue
    );
    const codeChanged = this.pythonCode !== this.initialPythonCode;
    const hasChanges = formChanged || codeChanged;
    this.hasUnsavedChanges.set(hasChanges);
    this.sidePanelService.setHasUnsavedChanges(hasChanges);
  }

  private isEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private isFormValid(): boolean {
    return this.conditionalEdgeForm.valid && !this.codeEditorHasError;
  }

  private createInputMapFromPairs(): Record<string, string> {
    return this.inputMapPairs.controls
      .filter(this.isNonEmptyPair)
      .reduce(this.reducePairsToMap, {});
  }

  private isNonEmptyPair(control: AbstractControl): boolean {
    const value = control.value as InputMapPair;
    return value.key.trim() !== '' || value.value.trim() !== '';
  }

  private reducePairsToMap(
    acc: Record<string, string>,
    curr: AbstractControl
  ): Record<string, string> {
    const pair = curr.value as InputMapPair;
    if (pair.key?.trim()) {
      acc[pair.key.trim()] = pair.value;
    }
    return acc;
  }

  private createUpdatedNode(
    inputMapValue: Record<string, string>
  ): EdgeNodeModel {
    const pythonCodeData: CustomPythonCode = {
      name: this.node.node_name,
      libraries: this.node.data?.python_code?.libraries || [],
      code: this.pythonCode,
      entrypoint: 'main',
    };

    return {
      ...this.node,
      node_name: this.conditionalEdgeForm.value.node_name,
      input_map: inputMapValue,
      output_variable_path: this.conditionalEdgeForm.value.output_variable_path,
      data: {
        ...this.node.data,
        source: this.node.data.source,
        then: this.node.data.then,
        python_code: pythonCodeData,
      },
    };
  }

  public hasUnsavedChangesFn(): boolean {
    return this.hasUnsavedChanges();
  }
}

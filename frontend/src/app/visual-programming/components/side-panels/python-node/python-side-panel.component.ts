import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { PythonNodeModel } from '../../../core/models/node.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';
import { FlowService } from '../../../services/flow.service';
import { CodeEditorComponent } from '../../../../user-settings-page/tools/custom-tool-editor/code-editor/code-editor.component';
import { ToolLibrariesComponent } from '../../../../user-settings-page/tools/custom-tool-editor/tool-libraries/tool-libraries.component';
import { InputMapComponent } from '../../../components/input-map/input-map.component';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/cofirm-dialog/confirmation-dialog.component';
import { DialogModule } from '@angular/cdk/dialog';
import { SidePanelService } from '../../../services/side-panel.service';
import { ShortcutListenerDirective } from '../../../core/directives/shortcut-listener.directive';

@Component({
  selector: 'app-python-side-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    ToolLibrariesComponent,
    CodeEditorComponent,
    InputMapComponent,
    DialogModule,
    ShortcutListenerDirective,
  ],
  templateUrl: './python-side-panel.component.html',
  styleUrls: ['./python-side-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PythonSidePanelComponent implements OnInit, OnDestroy {
  @Input() public node!: PythonNodeModel;
  @Output() public closePanel = new EventEmitter<void>();
  @Output() public nodeUpdated = new EventEmitter<PythonNodeModel>();
  @Output() public nodeExpanded = new EventEmitter<boolean>();

  public readonly isExpanded = signal<boolean>(false);
  public readonly hasUnsavedChanges = signal<boolean>(false);

  public pythonForm: FormGroup;
  public pythonCode: string = '';
  public initialPythonCode: string = '';
  public codeEditorHasError: boolean = false;
  private initialFormValue: any;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly flowService: FlowService,
    private readonly dialog: Dialog,
    private readonly sidePanelService: SidePanelService
  ) {
    this.pythonForm = this.initializeForm();
  }

  public ngOnInit(): void {
    this.initializeNodeData();
    this.setupFormChangeTracking();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public get inputMapPairs(): FormArray {
    return this.pythonForm.get('input_map') as FormArray;
  }

  public get activeColor(): string {
    return this.node?.color || '#685fff';
  }

  public close(): void {
    console.log('close');
    this.sidePanelService.tryClosePanel().then((closed) => {
      if (closed) {
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
    if (this.pythonForm.valid && !this.codeEditorHasError) {
      const inputMapValue = this.processInputMapPairs();
      const updatedNode = this.createUpdatedNode(inputMapValue);
      this.nodeUpdated.emit(updatedNode);
      this.hasUnsavedChanges.set(false);
      this.sidePanelService.setHasUnsavedChanges(false);
      this.pythonForm.markAsPristine();
      this.initialPythonCode = this.pythonCode;
      this.initialFormValue = this.pythonForm.getRawValue();
    }
  }

  public toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
    this.nodeExpanded.emit(this.isExpanded());
  }

  private initializeForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      node_name: ['', [Validators.required]],
      input_map: this.fb.array([]),
      output_variable_path: [''],
    });
  }

  private initializeNodeData(): void {
    if (this.node) {
      this.pythonForm.patchValue({
        name: this.node.data?.name,
        node_name: this.node.node_name,
        output_variable_path: this.node.output_variable_path,
      });

      this.pythonCode = this.node.data?.code || '';
      this.initialPythonCode = this.pythonCode;

      this.initializeInputMap();
      this.pythonForm.markAsPristine();
      this.initialFormValue = this.pythonForm.getRawValue();
      this.hasUnsavedChanges.set(false);
    }
  }

  private setupFormChangeTracking(): void {
    // Track form changes
    this.pythonForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkForChanges();
      });
  }

  private checkForChanges(): void {
    const formChanged = !this.isEqual(
      this.pythonForm.getRawValue(),
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

  private initializeInputMap(): void {
    const inputMap = this.node.input_map;
    const inputMapArray = this.pythonForm.get('input_map') as FormArray;

    if (inputMap && Object.keys(inputMap).length > 0) {
      Object.entries(inputMap).forEach(([key, value]) => {
        inputMapArray.push(
          this.fb.group({
            key: [key],
            value: [value],
          })
        );
      });
    } else {
      inputMapArray.push(
        this.fb.group({
          key: [''],
          value: [''],
        })
      );
    }
  }

  private processInputMapPairs(): { [key: string]: string } {
    return this.inputMapPairs.controls
      .filter((control) => {
        const value = control.value;
        return value.key.trim() !== '' || value.value.trim() !== '';
      })
      .reduce((acc: { [key: string]: string }, curr: AbstractControl) => {
        const pair = curr.value;
        if (pair.key && pair.key.trim() !== '') {
          acc[pair.key.trim()] = pair.value;
        }
        return acc;
      }, {});
  }

  private createUpdatedNode(inputMapValue: {
    [key: string]: string;
  }): PythonNodeModel {
    return {
      ...this.node,
      node_name: this.pythonForm.value.node_name,
      input_map: inputMapValue,
      output_variable_path: this.pythonForm.value.output_variable_path,
      data: {
        ...(this.node.data || {}),
        name: this.pythonForm.value.name,
        code: this.pythonCode,
        libraries: this.node.data?.libraries || [],
      },
    };
  }

  // Expose the signal as a function for the template
  public hasUnsavedChangesFn(): boolean {
    return this.hasUnsavedChanges();
  }
}

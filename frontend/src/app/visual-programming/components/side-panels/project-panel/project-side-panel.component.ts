import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  signal,
  AfterViewInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ProjectNodeModel } from '../../../core/models/node.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';
import { FlowService } from '../../../services/flow.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { InputMapComponent } from '../../../components/input-map/input-map.component';
import { Dialog } from '@angular/cdk/dialog';
import { DialogModule } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/cofirm-dialog/confirmation-dialog.component';
import { SidePanelService } from '../../../services/side-panel.service';
import { ShortcutListenerDirective } from '../../../core/directives/shortcut-listener.directive';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';

interface InputMapPair {
  key: string;
  value: string;
}

@Component({
  selector: 'app-project-side-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DragDropModule,
    InputMapComponent,
    NgIf,
    DialogModule,
    ShortcutListenerDirective,
    HelpTooltipComponent,
  ],
  templateUrl: './project-side-panel.component.html',
  styleUrls: ['./project-side-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSidePanelComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() public node!: ProjectNodeModel;
  @Output() private closePanel = new EventEmitter<void>();
  @Output() private nodeUpdated = new EventEmitter<ProjectNodeModel>();

  public projectForm: FormGroup;
  public readonly hasUnsavedChanges = signal<boolean>(false);
  private initialFormValue: any;
  private formInitialized: boolean = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly flowService: FlowService,
    private readonly cdr: ChangeDetectorRef,
    private readonly dialog: Dialog,
    private readonly sidePanelService: SidePanelService
  ) {
    this.projectForm = this.initializeProjectForm();
  }
  public get activeColor(): string {
    return this.node?.color || '#685fff';
  }

  public ngOnInit(): void {
    this.initializeFormValues();
    this.initializeInputMap();
  }

  public ngAfterViewInit(): void {
    // Set up form change tracking after view is initialized and initial values are set
    setTimeout(() => {
      this.formInitialized = true;
      this.updateInitialFormValue();
      this.setupFormChangeTracking();
      this.cdr.detectChanges();
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public get inputMapPairs(): FormArray {
    return this.projectForm.get('input_map') as FormArray;
  }

  public close(): void {
    this.sidePanelService.tryClosePanel().then((closed) => {
      if (closed) {
        this.closePanel.emit();
      }
    });
  }

  public onSave(): void {
    if (this.isFormValid()) {
      const validInputPairs = this.getValidInputPairs();
      this.setValidatorsForInputPairs(validInputPairs);

      if (this.projectForm.valid) {
        const inputMapValue = this.createInputMapFromPairs(validInputPairs);
        const updatedNode = this.createUpdatedNode(inputMapValue);
        this.nodeUpdated.emit(updatedNode);
        this.updateInitialFormValue();
        this.hasUnsavedChanges.set(false);
        this.sidePanelService.setHasUnsavedChanges(false);
        this.projectForm.markAsPristine();
        this.cdr.detectChanges();
      }
    }
  }

  private initializeProjectForm(): FormGroup {
    return this.fb.group({
      node_name: ['', [Validators.required]],
      input_map: this.fb.array([]),
      output_variable_path: [''],
    });
  }

  private initializeFormValues(): void {
    if (this.node) {
      this.projectForm.patchValue({
        node_name: this.node.node_name,
        output_variable_path: this.node.output_variable_path,
      });
    }
  }

  private updateInitialFormValue(): void {
    this.initialFormValue = this.getNormalizedFormValue();
  }

  private setupFormChangeTracking(): void {
    this.projectForm.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.formInitialized) {
          this.checkForChanges();
        }
      });
  }

  private checkForChanges(): void {
    const currentValue = this.getNormalizedFormValue();
    const formChanged = !this.isEqual(currentValue, this.initialFormValue);
    this.hasUnsavedChanges.set(formChanged);
    this.sidePanelService.setHasUnsavedChanges(formChanged);
  }

  private getNormalizedFormValue(): any {
    const formValue = this.projectForm.getRawValue();
    const normalizedValue = { ...formValue };

    // Filter out empty input pairs
    if (normalizedValue.input_map?.length) {
      normalizedValue.input_map = normalizedValue.input_map.filter(
        (pair: InputMapPair) =>
          pair.key.trim() !== '' || pair.value.trim() !== ''
      );
    }

    return normalizedValue;
  }

  private isEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private initializeInputMap(): void {
    if (this.node.input_map && Object.keys(this.node.input_map).length > 0) {
      Object.entries(this.node.input_map).forEach(([key, value]) => {
        this.inputMapPairs.push(
          this.fb.group({
            key: [key, Validators.required],
            value: [value, Validators.required],
          })
        );
      });
    }
    // The empty input map will be added by the InputMapComponent's ngOnInit
  }

  private getValidInputPairs(): AbstractControl[] {
    return this.inputMapPairs.controls.filter((control) => {
      const value = control.value;
      return value.key.trim() !== '' || value.value.trim() !== '';
    });
  }

  private setValidatorsForInputPairs(pairs: AbstractControl[]): void {
    pairs.forEach((control) => {
      control.get('key')?.setValidators([Validators.required]);
      control.get('value')?.setValidators([Validators.required]);
      control.get('key')?.updateValueAndValidity();
      control.get('value')?.updateValueAndValidity();
    });
  }

  private createInputMapFromPairs(
    pairs: AbstractControl[]
  ): Record<string, string> {
    return pairs.reduce(
      (acc: Record<string, string>, curr: AbstractControl) => {
        const pair = curr.value as InputMapPair;
        if (pair.key?.trim()) {
          acc[pair.key.trim()] = pair.value;
        }
        return acc;
      },
      {}
    );
  }

  private createUpdatedNode(
    inputMapValue: Record<string, string>
  ): ProjectNodeModel {
    return {
      ...this.node,
      node_name: this.projectForm.value.node_name,
      input_map: inputMapValue,
      output_variable_path: this.projectForm.value.output_variable_path,
      data: {
        ...(this.node.data || {}),
      },
    };
  }

  private isFormValid(): boolean {
    return this.projectForm.valid;
  }

  public hasUnsavedChangesFn(): boolean {
    return this.hasUnsavedChanges();
  }
}

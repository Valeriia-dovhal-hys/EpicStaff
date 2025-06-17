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
import { takeUntil } from 'rxjs/operators';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';
import { FlowService } from '../../../services/flow.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { InputMapComponent } from '../../../components/input-map/input-map.component';
import { Dialog } from '@angular/cdk/dialog';
import { DialogModule } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from '../../../../shared/components/cofirm-dialog/confirmation-dialog.component';
import { SidePanelService } from '../../../services/side-panel.service';
import { ShortcutListenerDirective } from '../../../core/directives/shortcut-listener.directive';

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
  ],
  templateUrl: './project-side-panel.component.html',
  styleUrls: ['./project-side-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSidePanelComponent implements OnInit, OnDestroy {
  @Input() public node!: ProjectNodeModel;
  @Output() private closePanel = new EventEmitter<void>();
  @Output() private nodeUpdated = new EventEmitter<ProjectNodeModel>();

  public projectForm: FormGroup;
  public readonly hasUnsavedChanges = signal<boolean>(false);
  private initialFormValue: any;

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
    this.setupFormChangeTracking();
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
      this.updateInitialFormValue();
      this.hasUnsavedChanges.set(false);
    }
  }

  private updateInitialFormValue(): void {
    this.initialFormValue = this.projectForm.getRawValue();
  }

  private setupFormChangeTracking(): void {
    this.projectForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkForChanges();
      });
  }

  private checkForChanges(): void {
    const formChanged = !this.isEqual(
      this.projectForm.getRawValue(),
      this.initialFormValue
    );
    this.hasUnsavedChanges.set(formChanged);
    this.sidePanelService.setHasUnsavedChanges(formChanged);
  }

  private isEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private initializeInputMap(): void {
    if (this.node.input_map) {
      Object.entries(this.node.input_map).forEach(([key, value]) => {
        this.inputMapPairs.push(
          this.fb.group({
            key: [key, Validators.required],
            value: [value, Validators.required],
          })
        );
      });
    }
  }

  private ensureMinimumInputMapPairs(): void {
    if (this.inputMapPairs.length === 0) {
      this.inputMapPairs.push(
        this.fb.group({
          key: [''],
          value: [''],
        })
      );
    }
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

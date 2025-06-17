import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ProjectNodeModel } from '../../../core/models/node.model';
import { NgIf, NgFor } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { uniqueNodeNameValidator } from '../unique-node-name-validator/unique-node-name.validator';
import { FlowService } from '../../../services/flow.service';

@Component({
  selector: 'app-project-side-panel',
  standalone: true,
  templateUrl: './project-side-panel.component.html',
  styleUrls: ['./project-side-panel.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, NgFor, DragDropModule],
  animations: [
    trigger('expandInOut', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class ProjectSidePanelComponent implements OnInit {
  @Input() node!: ProjectNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<ProjectNodeModel>();

  public projectForm!: FormGroup;
  public sliderValue: number = 50;
  public advancedSettingsOpen: boolean = false;

  constructor(private fb: FormBuilder, private flowService: FlowService) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
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
      description: [this.node.data.description],
      process: [this.node.data.process, Validators.required],
      // Hierarchical settings (only used if process === 'hierarchical')
      planning_llm_config: [this.node.data.planning_llm_config],
      manager_llm_config: [this.node.data.manager_llm_config],
      embedding_config: [this.node.data.embedding_config],
      default_temperature: [this.node.data.default_temperature],
      // Advanced settings (toggled via button)
      memory: [this.node.data.memory],
      cache: [this.node.data.cache],
      full_output: [this.node.data.full_output],
      planning: [this.node.data.planning],
    });
    this.sliderValue = this.node.data.default_temperature || 50;
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
    return this.projectForm.get('input_map') as FormArray;
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

  onSliderInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.sliderValue = +inputElement.value;
    this.projectForm.patchValue({ default_temperature: this.sliderValue });
  }

  toggleAdvancedSettings(): void {
    this.advancedSettingsOpen = !this.advancedSettingsOpen;
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.getRawValue();

      // Build the input_map object from the form array
      const inputMapObject = this.buildInputMapObject();

      const updatedNode: ProjectNodeModel = {
        ...this.node,
        node_name: formValue.node_name,
        input_map: inputMapObject,
        output_variable_path: formValue.output_variable_path.trim() || null,
        data: {
          ...this.node.data,
          description: formValue.description,
          process: formValue.process,
          planning_llm_config: formValue.planning_llm_config,
          manager_llm_config: formValue.manager_llm_config,
          embedding_config: formValue.embedding_config,
          default_temperature: formValue.default_temperature,
          memory: formValue.memory,
          cache: formValue.cache,
          full_output: formValue.full_output,
          planning: formValue.planning,
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

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import { NgClass, NgFor, NgIf } from '@angular/common';
import { LLMNodeModel } from '../../../core/models/node.model';

@Component({
  selector: 'app-llm-config-side-panel',
  standalone: true,
  templateUrl: './llm-edit-dialog.component.html',
  styleUrls: ['./llm-edit-dialog.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, NgClass, NgFor, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LLMConfigSidePanelComponent implements OnInit {
  // Standardize to "node" so that the dynamic host can set it uniformly.
  @Input() node!: LLMNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<LLMNodeModel>();

  public configForm!: FormGroup;
  sliderValue: number = 50;
  apiKeyVisible: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.configForm = this.fb.group({
      custom_name: [this.node.data.custom_name, Validators.required],
      api_key: [this.node.data.api_key, Validators.required],
      num_ctx: [
        this.node.data.num_ctx,
        [Validators.required, Validators.min(1)],
      ],
      temperature: [
        this.node.data.temperature,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      model: [this.node.data.model, Validators.required],
      is_visible: [this.node.data.is_visible],
      input_map: this.fb.array(this.initInputMapFormArray()),
      output_variable_path: [this.node.output_variable_path || ''],
    });

    this.sliderValue = this.node.data.temperature;
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
    return this.configForm.get('input_map') as FormArray;
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

  /** Toggle between password and text view for the API key */
  toggleApiKeyVisibility(): void {
    this.apiKeyVisible = !this.apiKeyVisible;
  }

  /** Update the slider's value and patch the form control */
  onSliderInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.sliderValue = +inputElement.value;
    this.configForm.patchValue({ temperature: this.sliderValue });
  }

  onSubmit(): void {
    if (this.configForm.valid) {
      // Build the input_map object from the form array
      const inputMapObject = this.buildInputMapObject();

      // Merge updated fields into node.data only, preserving base node properties
      const updatedNode: LLMNodeModel = {
        ...this.node,
        input_map: inputMapObject,
        output_variable_path:
          this.configForm.value.output_variable_path?.trim() || null,
        data: {
          ...this.node.data,
          custom_name: this.configForm.value.custom_name,
          api_key: this.configForm.value.api_key,
          num_ctx: this.configForm.value.num_ctx,
          temperature: this.configForm.value.temperature,
          model: this.configForm.value.model,
          is_visible: this.configForm.value.is_visible,
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

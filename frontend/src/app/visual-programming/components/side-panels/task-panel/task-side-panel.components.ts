import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TaskNodeModel } from '../../../core/models/node.model';
import { NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-task-side-panel',
  standalone: true,
  templateUrl: './task-side-panel.component.html',
  styleUrls: ['./task-side-panel.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, NgIf],
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
export class TaskSidePanelComponent implements OnInit {
  @Input() node!: TaskNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<TaskNodeModel>();

  public taskForm!: FormGroup;
  public advancedSettingsOpen: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.taskForm = this.fb.group({
      // Basic fields always visible
      name: [this.node.data.name || '', Validators.required],
      instructions: [this.node.data.instructions || '', Validators.required],
      expected_output: [this.node.data.expected_output || ''],
      // Advanced fields (toggled)
      human_input: [this.node.data.human_input, Validators.required],
      async_execution: [this.node.data.async_execution, Validators.required],
      // output_model is set to "none" initially and disabled.
      output_model: [
        { value: this.node.data.output_model || 'none', disabled: true },
      ],
    });
  }

  toggleAdvancedSettings(): void {
    this.advancedSettingsOpen = !this.advancedSettingsOpen;
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const updatedNode: TaskNodeModel = {
        ...this.node,
        data: {
          ...this.node.data,
          ...this.taskForm.getRawValue(),
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

import { Component, Inject, OnInit } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonEditorComponent } from '../../../../shared/components/json-editor/json-editor.component';

export interface AdvancedTaskSettingsData {
  config: any | null;
  output_model: any | null;
  task_context_list: number[];
  taskName: string;
  availableTasks?: any[]; // Added availableTasks property
}

@Component({
  selector: 'app-advanced-task-settings-dialog',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, JsonEditorComponent],
  templateUrl: './advanced-task-settings-dialog.component.html',
  styleUrls: ['./advanced-task-settings-dialog.component.scss'],
})
export class AdvancedTaskSettingsDialogComponent implements OnInit {
  taskData: AdvancedTaskSettingsData;
  jsonConfig: string = '{}';
  availableTasks: any[] = [];
  selectedTaskIds: number[] = [];
  isJsonValid: boolean = true;

  constructor(
    public dialogRef: DialogRef<AdvancedTaskSettingsData>,
    @Inject(DIALOG_DATA) public data: AdvancedTaskSettingsData
  ) {
    console.log('Dialog data:', data);
    this.taskData = {
      ...data,
      config: null, // Always set config to null
      task_context_list: data.task_context_list || [], // Keep task_context_list or initialize empty array
      output_model: data.output_model || null, // Keep output_model if exists
    };

    // Initialize available tasks from incoming data and sort by order
    this.availableTasks = [...(data.availableTasks || [])].sort((a, b) => {
      // Handle null order values
      if (a.order === null && b.order === null) {
        return 0;
      }
      if (a.order === null) {
        return 1; // Push nulls to the end
      }
      if (b.order === null) {
        return -1;
      }
      return a.order - b.order; // Sort by order (ascending)
    });

    // Initialize selected task IDs from task_context_list
    this.selectedTaskIds = Array.isArray(data.task_context_list)
      ? [...data.task_context_list].map((id) =>
          typeof id === 'string' ? parseInt(id, 10) : id
        )
      : [];

    console.log(
      'Initial selectasdsadasdasdsaaaaaaaaaaaaaaaed tasasadddddddddsk IDs:',
      this.selectedTaskIds
    );
    console.log('Available tasks (sorted):', this.availableTasks);
  }

  ngOnInit(): void {
    // Initialize JSON config based on output_model if exists
    if (this.taskData.output_model) {
      try {
        this.jsonConfig = JSON.stringify(this.taskData.output_model, null, 2);
      } catch (e) {
        this.jsonConfig = this.getDefaultJsonSchema();
      }
    } else {
      this.jsonConfig = this.getDefaultJsonSchema();
    }
  }

  private getDefaultJsonSchema(): string {
    const defaultSchema = {
      type: 'object',
      title: 'TaskOutputModel',
      properties: {
        question: {
          type: 'string',
          description: 'User prompt',
        },
      },
    };
    return JSON.stringify(defaultSchema, null, 2);
  }

  onJsonValidChange(isValid: boolean): void {
    this.isJsonValid = isValid;
  }

  toggleTaskSelection(taskId: number): void {
    const index = this.selectedTaskIds.indexOf(taskId);

    if (index === -1) {
      // Task is not selected, add it
      this.selectedTaskIds.push(taskId);
    } else {
      // Task is already selected, remove it
      this.selectedTaskIds.splice(index, 1);
    }

    console.log('Updated selected task IDs:', this.selectedTaskIds);
  }

  isTaskSelected(taskId: number): boolean {
    return this.selectedTaskIds.includes(taskId);
  }

  // Helper to format order display
  formatOrder(order: number | null): string {
    return order === null ? 'null' : `${order}`;
  }

  save(): void {
    if (!this.isJsonValid) {
      return; // Don't save if JSON is invalid
    }

    try {
      // Parse JSON config
      const parsedJson = this.jsonConfig ? JSON.parse(this.jsonConfig) : null;

      // Update task data with selected task IDs
      const result = {
        ...this.taskData,
        config: null,
        output_model: parsedJson,
        task_context_list: this.selectedTaskIds,
      };

      console.log('Saving data:', result);
      this.dialogRef.close(result);
    } catch (e) {
      // Handle JSON parsing error
      console.error('Invalid JSON format:', e);
      this.isJsonValid = false;
      // You might want to display an error message to the user here
    }
  }
}

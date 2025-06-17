import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

export interface AdvancedTaskSettingsData {
  config: any | null;
  output_model: any | null;
  task_context_list: any | null;
  taskName: string;
}

interface PropertyField {
  name: string;
  type: string; // 'string' or 'number'
  value: string;
}

@Component({
  selector: 'app-advanced-task-settings-dialog',
  imports: [FormsModule,  NgFor],
  standalone: true,
  templateUrl: './advanced-task-settings-dialog.component.html',
  styleUrls: ['./advanced-task-settings-dialog.component.scss'],
})
export class AdvancedTaskSettingsDialogComponent implements OnInit {
  taskData: AdvancedTaskSettingsData;
  // Dynamic list of property fields
  propertyFields: PropertyField[] = [];

  constructor(
    public dialogRef: DialogRef<AdvancedTaskSettingsData>,
    @Inject(DIALOG_DATA) public data: AdvancedTaskSettingsData
  ) {
    console.log(data);
    this.taskData = {
      ...data,
      config: null,
      task_context_list: [],
      output_model: data.output_model || null,
    };
  }

  ngOnInit(): void {
    // If there is an existing output_model with properties, parse them into propertyFields.
    if (
      this.taskData.output_model &&
      this.taskData.output_model.properties &&
      typeof this.taskData.output_model.properties === 'object'
    ) {
      const props = this.taskData.output_model.properties;
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          const p = props[key];
          this.propertyFields.push({
            name: key,
            type: p.type || 'string',
            value: p.value !== undefined ? p.value.toString() : '',
          });
        }
      }
    }
  }

  addProperty(): void {
    this.propertyFields.push({ name: '', type: 'string', value: '' });
  }

  removeProperty(index: number): void {
    this.propertyFields.splice(index, 1);
  }

  save(): void {
    // Build the properties object from the dynamic fields.
    const properties: { [key: string]: { type: string; value: any } } = {};
    this.propertyFields.forEach((field) => {
      if (field.name.trim()) {
        let fieldValue: any = field.value;
        if (field.type === 'number') {
          fieldValue = Number(field.value);
        }
        properties[field.name] = { type: field.type, value: fieldValue };
      }
    });

    const result = {
      config: null,
      output_model: {
        type: 'object',
        title: 'output_model',
        properties: properties,
      },
      task_context_list: [],
      taskName: this.taskData.taskName,
    };

    this.dialogRef.close(result);
  }
}

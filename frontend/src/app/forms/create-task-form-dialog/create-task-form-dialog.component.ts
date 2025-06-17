import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';

import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { CreateTaskRequest } from '../../shared/models/task.model';
import { Agent } from '../../shared/models/agent.model';
import { AgentsService } from '../../services/staff.service';
import { ToolConfigSelectorDialogComponent } from '../../handsontable-tables/staff/tools-selector-dialog/tool-config-selector-dialog/tool-config-selector-dialog.component';

interface Tool {
  id: number;
  name: string;
}

interface Context {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-task-dialog',
  templateUrl: './create-task-form-dialog.component.html',
  styleUrls: ['./create-task-form-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskFormDialogComponent implements OnInit {
  public taskForm!: FormGroup;
  public agents: Agent[] = [];
  public selectedTools: Tool[] = [];
  public contextList: Context[] = [];
  public advancedSettingsVisible = false;
  public projectId: number;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateTaskFormDialogComponent>,
    private snackbarService: SharedSnackbarService,
    private agentsService: AgentsService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    // Assuming this is set via a setter or injection
    this.projectId = 0;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      instructions: ['', Validators.required],
      expected_output: ['', Validators.required],
      order: [null],
      agent: [null],
      human_input: [false],
      async_execution: [false],
      task_context_list: [[]],
      config: [null],
      output_model: [null],
      // We'll handle task_tool_list separately with the selectedTools array
    });
  }

  public toggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
    this.cdr.markForCheck();
  }

  public openToolSelector(): void {
    const dialogRef = this.dialog.open(ToolConfigSelectorDialogComponent, {
      width: '600px',
      data: {
        selectedTools: [...this.selectedTools],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedTools = result;
        this.cdr.markForCheck();
      }
    });
  }

  public removeTool(tool: Tool): void {
    this.selectedTools = this.selectedTools.filter((t) => t.id !== tool.id);
    this.cdr.markForCheck();
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.snackbarService.showSnackbar(
        'Please fill all required fields',
        'error'
      );
      return;
    }

    const formData = this.taskForm.value;
    const toolIds = this.selectedTools.map((tool) => tool.id);

    // Create the task request object
    const newTask: CreateTaskRequest = {
      name: formData.name,
      instructions: formData.instructions,
      expected_output: formData.expected_output,
      // Don't send empty/null values
      ...(formData.order !== null && { order: formData.order }),
      ...(formData.agent !== null && { agent: formData.agent }),
      human_input: formData.human_input,
      async_execution: formData.async_execution,
      // Include tools if there are any
      ...(toolIds.length > 0 && { task_tool_list: toolIds }),
      // Include the project ID
      crew: this.projectId,
    };

    // Close the dialog and pass the created task
    this.dialogRef.close(newTask);
  }
}

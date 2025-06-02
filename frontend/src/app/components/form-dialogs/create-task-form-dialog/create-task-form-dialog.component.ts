import {
  Component,
  Inject,
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
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Agent } from '../../../shared/models/agent.model';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Task } from '../../../shared/models/task.model';

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './create-task-form-dialog.component.html',
  styleUrls: ['./create-task-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskFormDialogComponent implements OnInit {
  public taskForm!: FormGroup;
  public agents: Agent[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { agents: Agent[]; projectId: number },
    public dialogRef: MatDialogRef<CreateTaskFormDialogComponent>,
    private fb: FormBuilder,
    private sharedSnackbarService: SharedSnackbarService
  ) {
    this.agents = data.agents;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.taskForm = this.fb.group({
      name: ['', Validators.required],
      instructions: ['', Validators.required],
      expected_output: ['', Validators.required],
      agent: [null],
      order: [null, Validators.required],
    });
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.taskForm.valid) {
      const formData = this.taskForm.value;

      const newTask = {
        crew: this.data.projectId,
        name: formData.name,
        instructions: formData.instructions,
        expected_output: formData.expected_output,
        order: formData.order,
        agent: formData.agent ? formData.agent.id : null,
      };

      // Pass the data back to the parent
      this.dialogRef.close(newTask);
    }
  }
}

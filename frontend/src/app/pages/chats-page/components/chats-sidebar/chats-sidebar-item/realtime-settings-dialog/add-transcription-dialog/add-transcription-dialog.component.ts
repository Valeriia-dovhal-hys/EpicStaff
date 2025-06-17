import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastService } from '../../../../../../../services/notifications/toast.service';
import { TranscriptionConfigsService } from '../../../../../../../services/transcription-config.service';

import { realTimeTranscriptionModels } from '../../../../../../../shared/constants/transcription-models.constants';
import {
  CreateTranscriptionConfigRequest,
  GetTranscriptionConfigRequest,
} from '../../../../../../../shared/models/transcription-config.model';

export interface AddTranscriptionConfigDialogData {
  providerId?: number;
}

@Component({
  selector: 'app-add-transcription-config-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-transcription-config-dialog.component.html',
  styleUrls: ['./add-transcription-config-dialog.component.scss'],
})
export class AddTranscriptionConfigDialogComponent implements OnInit {
  transcriptionForm!: FormGroup;
  showApiKey = false;
  models = realTimeTranscriptionModels;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: DialogRef<GetTranscriptionConfigRequest>,
    private toastService: ToastService,
    private transcriptionConfigsService: TranscriptionConfigsService,
    @Inject(DIALOG_DATA) public data: AddTranscriptionConfigDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.transcriptionForm = this.fb.group({
      realtime_transcription_model: ['', Validators.required],
      custom_name: ['', Validators.required],
      api_key: ['', Validators.required],
    });
  }

  showError(controlName: string): boolean {
    const control = this.transcriptionForm.get(controlName);
    return control
      ? control.invalid && (control.touched || control.dirty)
      : false;
  }

  toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }

  onConfirm(): void {
    if (this.transcriptionForm.valid) {
      this.submitting = true;
      const formValue = this.transcriptionForm.value;

      const config: CreateTranscriptionConfigRequest = {
        realtime_transcription_model: Number(
          formValue.realtime_transcription_model
        ),
        api_key: formValue.api_key,
        custom_name: formValue.custom_name,
      };

      // Create the transcription config through the service
      this.transcriptionConfigsService
        .createTranscriptionConfig(config)
        .subscribe({
          next: (createdConfig: GetTranscriptionConfigRequest) => {
            this.toastService.success(
              `Transcription configuration "${createdConfig.custom_name}" has been successfully created`
            );
            // Close the dialog with the created config
            this.dialogRef.close(createdConfig);
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error creating transcription config:', error);
            this.toastService.error(
              'Failed to create transcription configuration'
            );
            this.submitting = false;
          },
        });
    } else {
      // Mark all fields as touched to show validation errors
      this.transcriptionForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

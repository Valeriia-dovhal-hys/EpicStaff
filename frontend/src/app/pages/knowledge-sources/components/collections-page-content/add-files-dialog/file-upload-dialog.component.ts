// file-upload-dialog.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import {
  Dialog,
  DialogRef,
  DIALOG_DATA,
  DialogModule,
} from '@angular/cdk/dialog';

import { ChunkStrategy } from '../../../models/source-collection.model';
import { CollectionsService } from '../../../services/source-collections.service';

// Interface to track file settings
interface FileWithSettings {
  file: File;
  chunkStrategy: ChunkStrategy;
  chunkSize: number;
  overlapSize: number;
}

@Component({
  selector: 'app-file-upload-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.scss'],
})
export class FileUploadDialogComponent implements OnInit {
  filesForm: FormGroup;
  filesWithSettings: FileWithSettings[] = [];
  isDragging = false;

  // Maximum values for chunk size and overlap
  maxChunkSize = 8000;
  maxOverlapSize = 1000;

  // Default values
  defaultChunkSize = 1000;
  defaultOverlapSize = 200;
  defaultChunkStrategy: ChunkStrategy = 'token';

  // Chunk strategies
  chunkStrategies: { label: string; value: ChunkStrategy }[] = [
    { label: 'Token', value: 'token' },
    { label: 'Character', value: 'character' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'html' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<any>,
    private _sourceCollectionsService: CollectionsService,
    @Inject(DIALOG_DATA) public data: { collectionId: number }
  ) {
    this.filesForm = this.fb.group({
      fileSettings: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    // Initialize any necessary data
  }

  get fileSettingsFormArray() {
    return this.filesForm.get('fileSettings') as FormArray;
  }

  createFileSettingsGroup(file: File): FormGroup {
    return this.fb.group({
      fileName: [file.name],
      fileSize: [file.size],
      chunkStrategy: [this.defaultChunkStrategy, [Validators.required]],
      chunkSize: [
        this.defaultChunkSize,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(this.maxChunkSize),
        ],
      ],
      overlapSize: [
        this.defaultOverlapSize,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(this.maxOverlapSize),
        ],
      ],
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  handleFiles(fileList: FileList): void {
    Array.from(fileList).forEach((file) => {
      // Check if file already exists in the list by name and size
      const existingFileIndex = this.filesWithSettings.findIndex(
        (f) => f.file.name === file.name && f.file.size === file.size
      );

      if (existingFileIndex === -1) {
        // Add to our tracked array of files with settings
        this.filesWithSettings.push({
          file,
          chunkStrategy: this.defaultChunkStrategy,
          chunkSize: this.defaultChunkSize,
          overlapSize: this.defaultOverlapSize,
        });

        // Add a corresponding form group to the form array
        this.fileSettingsFormArray.push(this.createFileSettingsGroup(file));
      }
    });
  }

  removeFile(index: number): void {
    this.filesWithSettings.splice(index, 1);
    this.fileSettingsFormArray.removeAt(index);
    console.log('Remaining Files:', this.filesWithSettings);
  }

  updateFileSettings(index: number, field: string, value: any): void {
    // Update both the form array and our tracked array
    if (field === 'chunkStrategy') {
      this.filesWithSettings[index].chunkStrategy = value;
    } else if (field === 'chunkSize') {
      this.filesWithSettings[index].chunkSize = Number(value);
    } else if (field === 'overlapSize') {
      this.filesWithSettings[index].overlapSize = Number(value);
    }

    // Also update the corresponding form control
    const control = this.fileSettingsFormArray.at(index);
    control
      .get(field)
      ?.setValue(field === 'chunkStrategy' ? value : Number(value));
  }

  onSubmit(): void {
    if (this.filesForm.valid && this.filesWithSettings.length > 0) {
      console.log('Files to upload with settings:', this.filesWithSettings);

      // Prepare data for API submission
      const formData = new FormData();

      // Append collection ID
      formData.append('collection_id', this.data.collectionId.toString());

      // Append files and their corresponding settings with indexed names
      this.filesWithSettings.forEach((fileWithSettings, index) => {
        // Use 1-based indexing as mentioned in your existing code
        const fileIndex = index + 1;

        // Append file with index
        formData.append(
          `files[${fileIndex}]`,
          fileWithSettings.file,
          fileWithSettings.file.name
        );

        // Append settings with matching indices
        formData.append(
          `chunk_strategies[${fileIndex}]`,
          fileWithSettings.chunkStrategy
        );
        formData.append(
          `chunk_sizes[${fileIndex}]`,
          fileWithSettings.chunkSize.toString()
        );
        formData.append(
          `chunk_overlaps[${fileIndex}]`,
          fileWithSettings.overlapSize.toString()
        );
      });

      // Debug log
      const debug: { [key: string]: any } = {};
      formData.forEach((val, key) => (debug[key] = val));
      console.log('FormData to be sent:', debug);

      // Send the request inside the component
      this._sourceCollectionsService
        .uploadFiles(this.data.collectionId, formData)
        .subscribe({
          next: (response) => {
            console.log('Upload successful:', response);
            // Close dialog and return the successful response
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Upload failed', error);
            alert('Failed to upload files: ' + error.message);
          },
        });
    } else {
      console.warn('Form invalid or no files selected');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

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
import { HttpEventType, HttpResponse } from '@angular/common/http';

import { ChunkStrategy } from '../../models/source-collection.model';
import {
  FullEmbeddingConfig,
  FullEmbeddingConfigService,
} from '../../../../services/full-embedding.service';
import { EmbeddingSelectorComponent } from '../../../../forms/shared/embegginds-selector/embedding-selector.component';
import { CollectionsService } from '../../services/source-collections.service';

// New interface to track file settings
interface FileWithSettings {
  file: File;
  chunkStrategy: ChunkStrategy;
  chunkSize: number;
  overlapSize: number;
  isValid: boolean; // Track file validity
}

@Component({
  selector: 'app-create-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    EmbeddingSelectorComponent,
  ],
  templateUrl: './create-collection-dialog.component.html',
  styleUrls: ['./create-collection-dialog.component.scss'],
})
export class CreateCollectionDialogComponent implements OnInit {
  collectionForm: FormGroup;
  filesWithSettings: FileWithSettings[] = [];
  isSubmitting = false;
  progress = 0;
  isDragging = false;
  // Embedding models options
  embeddingConfigs: FullEmbeddingConfig[] = [];
  isLoadingEmbeddings = true;

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

  // Allowed file types
  allowedFileTypes = ['pdf', 'csv', 'docx', 'txt', 'json', 'html'];

  // Track if we have any invalid files
  hasInvalidFiles = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<any>,
    private sourceCollectionsService: CollectionsService,
    private fullEmbeddingConfigService: FullEmbeddingConfigService,
    @Inject(DIALOG_DATA) public data: any
  ) {
    this.collectionForm = this.fb.group({
      name: ['', [Validators.required]],
      embedding_config: [null, [Validators.required]],
      fileSettings: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadEmbeddingConfigs();
  }

  get fileSettingsFormArray() {
    return this.collectionForm.get('fileSettings') as FormArray;
  }

  createFileSettingsGroup(file: File, isValid: boolean): FormGroup {
    return this.fb.group({
      fileName: [file.name],
      fileSize: [file.size],
      isValid: [isValid],
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

  // Helper method to check if file type is allowed
  isValidFileType(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return this.allowedFileTypes.includes(extension);
  }

  // Check if any files are invalid
  checkForInvalidFiles(): void {
    this.hasInvalidFiles = this.filesWithSettings.some((file) => !file.isValid);
  }

  loadEmbeddingConfigs(): void {
    this.isLoadingEmbeddings = true;
    this.fullEmbeddingConfigService.getFullEmbeddingConfigs().subscribe({
      next: (configs) => {
        this.embeddingConfigs = configs;

        // If we have embedding configs, select the first one by default
        if (this.embeddingConfigs.length > 0) {
          this.collectionForm.patchValue({
            embedding_config: this.embeddingConfigs[0].id,
          });
        }

        this.isLoadingEmbeddings = false;
        console.log('Embedding Configs Loaded:', this.embeddingConfigs);
      },
      error: (error) => {
        console.error('Error loading embedding configs:', error);
        this.isLoadingEmbeddings = false;
      },
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
        // Check if file type is valid
        const isValid = this.isValidFileType(file);

        // Add to our tracked array of files with settings
        this.filesWithSettings.push({
          file,
          chunkStrategy: this.defaultChunkStrategy,
          chunkSize: this.defaultChunkSize,
          overlapSize: this.defaultOverlapSize,
          isValid: isValid,
        });

        // Add a corresponding form group to the form array
        this.fileSettingsFormArray.push(
          this.createFileSettingsGroup(file, isValid)
        );
      }
    });

    // Update invalid files status
    this.checkForInvalidFiles();

    console.log('Files Added:', this.filesWithSettings);
  }

  removeFile(index: number): void {
    this.filesWithSettings.splice(index, 1);
    this.fileSettingsFormArray.removeAt(index);

    // Update invalid files status after removal
    this.checkForInvalidFiles();

    console.log('Remaining Files:', this.filesWithSettings);
  }

  updateFileSettings(index: number, field: string, value: any): void {
    // Update both the form array and our tracked array
    if (field === 'chunkStrategy') {
      this.filesWithSettings[index].chunkStrategy = value;
    } else if (field === 'chunkSize') {
      this.filesWithSettings[index].chunkSize = value;
    } else if (field === 'overlapSize') {
      this.filesWithSettings[index].overlapSize = value;
    }

    // Also update the corresponding form control
    const control = this.fileSettingsFormArray.at(index);
    control.get(field)?.setValue(value);
  }

  onSubmit(): void {
    if (
      this.collectionForm.valid &&
      this.filesWithSettings.length > 0 &&
      !this.hasInvalidFiles
    ) {
      this.isSubmitting = true;
      this.progress = 0;

      const formData = new FormData();

      // Collection name
      formData.append(
        'collection_name',
        this.collectionForm.get('name')?.value
      );

      // User ID (hardcoded to '1' as requested)
      formData.append('user_id', '1');

      // Embedder (mapping from embedding_config)
      // Get the embedding config value and convert it to number
      const embeddingConfigId =
        this.collectionForm.get('embedding_config')?.value;
      // Ensure the embedder value is a number
      const embedderValue =
        typeof embeddingConfigId === 'string'
          ? parseInt(embeddingConfigId, 10)
          : embeddingConfigId;

      formData.append('embedder', embedderValue.toString());

      // Append files and their corresponding settings with indexed names
      this.filesWithSettings.forEach((fileWithSettings, index) => {
        // Use 1-based indexing as mentioned in your requirement
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

      // Debug
      const debug: { [key: string]: any } = {};
      formData.forEach((val, key) => (debug[key] = val));
      console.log('FormData:', debug);

      // POST to service
      this.sourceCollectionsService.createSourceCollection(formData).subscribe({
        next: (res) => {
          console.log('Collection created:', res);
          this.dialogRef.close(res);
        },
        error: (err) => {
          console.error('Error creating collection:', err);
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
          this.dialogRef.close();
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

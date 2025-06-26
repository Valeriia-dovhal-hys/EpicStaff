import { Component, OnInit, Inject, ViewChild } from '@angular/core';
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

import {
  ChunkStrategy,
  GetSourceCollectionRequest,
} from '../../models/source-collection.model';
import {
  FullEmbeddingConfig,
  FullEmbeddingConfigService,
} from '../../../../features/settings-dialog/services/embeddings/full-embedding.service';
import { CollectionsService } from '../../services/source-collections.service';
import { ToastService } from '../../../../services/notifications/toast.service';

import { uniqueCollectionNameValidator } from '../../../../shared/form-validators/unique-collection-name.validator';
import { FileUploadContainerComponent } from './file-upload-container/file-upload-container.component';
import { EmbeddingModelSelectorComponent } from '../../../../shared/components/embedding-model-selector/embedding-model-selector.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { HelpTooltipComponent } from '../../../../shared/components/help-tooltip/help-tooltip.component';

@Component({
  selector: 'app-create-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,

    FileUploadContainerComponent,
    EmbeddingModelSelectorComponent,
    ButtonComponent,
    HelpTooltipComponent,
  ],
  templateUrl: './create-collection-dialog.component.html',
  styleUrls: ['./create-collection-dialog.component.scss'],
})
export class CreateCollectionDialogComponent implements OnInit {
  @ViewChild(FileUploadContainerComponent)
  fileUploader!: FileUploadContainerComponent;

  collectionForm: FormGroup;
  isSubmitting = false;
  progress = 0;
  // Embedding models options
  embeddingConfigs: FullEmbeddingConfig[] = [];
  isLoadingEmbeddings = true;
  collections: GetSourceCollectionRequest[] = [];

  // Maximum values for chunk size and overlap
  maxChunkSize = 8000;
  maxOverlapSize = 1000;

  // Chunk strategies
  chunkStrategies: { label: string; value: ChunkStrategy }[] = [
    { label: 'Token', value: 'token' },
    { label: 'Character', value: 'character' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'html' },
  ];

  // Track if we have any invalid files
  hasInvalidFiles = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<any>,
    private collectionsService: CollectionsService,
    private fullEmbeddingConfigService: FullEmbeddingConfigService,
    private toastService: ToastService,
    @Inject(DIALOG_DATA)
    public data: { collections: GetSourceCollectionRequest[] }
  ) {
    // Store the passed collections
    this.collections = data.collections || [];

    // Create form with unique name validator
    this.collectionForm = this.fb.group({
      name: [
        '',
        [Validators.required, uniqueCollectionNameValidator(this.collections)],
      ],
      embedding_config: [null, [Validators.required]],
      fileSettings: this.fb.array([]),
      additionalParams: this.fb.group({}),
    });
  }

  ngOnInit(): void {
    this.loadEmbeddingConfigs();
  }

  get fileSettingsFormArray() {
    return this.collectionForm.get('fileSettings') as FormArray;
  }

  get nameControl() {
    return this.collectionForm.get('name');
  }

  get hasDuplicateNameError(): boolean {
    const control = this.nameControl;
    return control
      ? control.hasError('duplicateName') && control.touched
      : false;
  }

  loadEmbeddingConfigs(): void {
    this.isLoadingEmbeddings = true;
    this.fullEmbeddingConfigService.getFullEmbeddingConfigs().subscribe({
      next: (configs) => {
        this.embeddingConfigs = configs;

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

  onInvalidFilesChange(hasInvalidFiles: boolean): void {
    this.hasInvalidFiles = hasInvalidFiles;
  }

  onSubmit(): void {
    if (
      this.collectionForm.valid &&
      this.fileSettingsFormArray.length > 0 &&
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

      // Add the additional_params field (JSON stringified)
      const additionalParamsValue =
        this.collectionForm.get('additionalParams')?.value || {};
      formData.append(
        'additional_params',
        JSON.stringify(additionalParamsValue)
      );

      // Add the file_additional_params field (JSON stringified from file uploader)
      const fileAdditionalParams = this.fileUploader.getAdditionalParams();
      formData.append(
        'file_additional_params',
        JSON.stringify(fileAdditionalParams)
      );

      // Get files with settings directly from the fileUploader component
      const filesWithSettings = this.fileUploader.getFiles();

      // Append files and their corresponding settings with indexed names
      filesWithSettings.forEach((fileWithSettings, index) => {
        // Use 1-based indexing as requested
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
      this.collectionsService
        .createGetSourceCollectionRequest(formData)
        .subscribe({
          next: (res) => {
            console.log('Collection created:', res);
            const collectionName = this.collectionForm.get('name')?.value;
            this.toastService.success(
              `Collection "${collectionName}" created successfully!`,
              5000,
              'bottom-right'
            );
            this.dialogRef.close(res);
          },
          error: (err) => {
            console.error('Error creating collection:', err);
            this.toastService.error(
              'Failed to create collection. Please try again.',
              7000,
              'bottom-right'
            );
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
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

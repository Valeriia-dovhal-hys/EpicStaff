// edit-project-form-dialog.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, NgIf } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProjectsService } from '../../../services/projects.service';
import { Project } from '../../../shared/models/project.model';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EmbeddingModelsService } from '../../../services/embeddings.service';
import { LLM_Models_Service } from '../../../services/LLM_models.service';
import { EmbeddingModel } from '../../../shared/models/embedding.model';
import { LLM_Model } from '../../../shared/models/LLM.model';
import { forkJoin, of, Subscription } from 'rxjs';
import { LLM_Providers_Service } from '../../../services/LLM_providers.service';
import { LLM_Provider } from '../../../shared/models/LLM_provider.model';
import {
  CreateLLMConfigRequest,
  LLM_Config,
} from '../../../shared/models/LLM_config.model';
import { LLM_Config_Service } from '../../../services/LLM_config.service';

@Component({
  selector: 'app-edit-project-form-dialog',
  templateUrl: './edit-project-form-dialog.component.html',
  styleUrls: ['./edit-project-form-dialog.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProjectFormDialogComponent implements OnInit, OnDestroy {
  public projectForm!: FormGroup;

  public processes = [
    { value: 'sequential', viewValue: 'Sequential' },
    { value: 'hierarchical', viewValue: 'Hierarchical' },
  ];

  // Data
  public LLM_providers: LLM_Provider[] = [];
  public embeddingModels: EmbeddingModel[] = [];

  public allLLMModels: LLM_Model[] = [];
  public filteredLLMModels: LLM_Model[] = [];

  // Selected Provider
  public selectedProviderId: number | null = null;

  // Visibility
  public isDataLoaded = false;
  public advancedSettingsVisible: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private snackbarService: SharedSnackbarService,
    public dialogRef: MatDialogRef<EditProjectFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: Project },
    private embeddingModelsService: EmbeddingModelsService,
    private llmModelsService: LLM_Models_Service,
    private llmprovidersService: LLM_Providers_Service,
    private llmConfigService: LLM_Config_Service,
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.loadModels();
  }

  private initializeForm(): void {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      assignment: [''],
      description: [''],
      process: ['sequential', Validators.required],
      memory: [false],
      embedding_model: [null, Validators.required],
      manager_llm_model: [null, Validators.required],
      manager_llm_config: [null],

      temperature: [
        null,
        [Validators.required, Validators.min(0), Validators.max(1)],
      ],
      num_ctx: [null, [Validators.required, Validators.min(0)]],
    });
  }

  private setFormValues(llmConfig: LLM_Config | null): void {
    const project = this.data.project;

    // Set the basic project fields
    this.projectForm.patchValue({
      name: project.name,
      assignment: project.assignment,
      description: project.description,
      process: project.process,
      memory: project.memory,
      embedding_model: project.embedding_model,
      manager_llm_model: project.manager_llm_model,
      manager_llm_config: project.manager_llm_config,
    });

    // Set LLM config values if available
    if (llmConfig) {
      this.projectForm.patchValue({
        temperature: llmConfig.temperature,
        num_ctx: llmConfig.num_ctx,
      });
    } else {
      // Handle case where LLM config is not available
      this.projectForm.patchValue({
        temperature: null,
        num_ctx: null,
      });
    }
  }

  private loadModels(): void {
    const models$ = forkJoin({
      embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
      llmModels: this.llmModelsService.getLLMModels(),
      LLM_providers: this.llmprovidersService.getProviders(),
    });

    const llmConfig$ = this.data.project.manager_llm_config
      ? this.llmConfigService.getConfigById(
          this.data.project.manager_llm_config
        )
      : of(null);

    this.subscriptions.add(
      forkJoin([models$, llmConfig$]).subscribe({
        next: ([models, llmConfig]) => {
          const { embeddingModels, llmModels, LLM_providers } = models;

          this.embeddingModels = embeddingModels;
          this.allLLMModels = llmModels;
          this.LLM_providers = LLM_providers;

          // Set selected provider based on current model
          const currentModel = this.allLLMModels.find(
            (model) => model.id === this.data.project.manager_llm_model
          );
          if (currentModel) {
            this.selectedProviderId = currentModel.llm_provider;
            this.filterLLMModelsByProvider(this.selectedProviderId);
          }

          this.setFormValues(llmConfig);

          this.isDataLoaded = true;
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error fetching data:', error);
          this.snackbarService.showSnackbar('Failed to load data.', 'error');
          this.isDataLoaded = true; // Allow form interaction even if data loading failed
          this.cdr.markForCheck();
        },
      })
    );
  }

  public onProviderChange(providerId: number): void {
    this.selectedProviderId = providerId;
    this.filterLLMModelsByProvider(providerId);
  }

  private filterLLMModelsByProvider(providerId: number): void {
    this.filteredLLMModels = this.allLLMModels.filter(
      (model: LLM_Model) => model.llm_provider === providerId
    );

    const managerLlmModelControl = this.projectForm.get('manager_llm_model');

    if (this.filteredLLMModels.length > 0) {
      // If current selected model is not in the filtered list, reset it
      const currentModelId = managerLlmModelControl?.value;
      if (
        !this.filteredLLMModels.some((model) => model.id === currentModelId)
      ) {
        managerLlmModelControl?.setValue(this.filteredLLMModels[0].id);
      }
    } else {
      managerLlmModelControl?.setValue(null);
    }
  }

  public onCancelForm(): void {
    this.dialogRef.close();
  }

  public onSubmitForm(): void {
    this.projectForm.markAllAsTouched();
    if (this.projectForm.valid) {
      this.projectForm.disable();

      const { temperature, num_ctx, ...projectFormData } =
        this.projectForm.value;

      const configData: CreateLLMConfigRequest = {
        temperature,
        num_ctx,
      };

      this.llmConfigService
        .updateConfig(this.data.project.manager_llm_config, configData)
        .subscribe({
          next: (updatedConfig: LLM_Config) => {
            this.submitProjectUpdate(this.data.project.manager_llm_config);
          },
          error: (error: Error) => {
            console.error('Error updating LLM config:', error);

            this.snackbarService.showSnackbar(
              'Failed to update LLM configuration. Please try again.',
              'error'
            );
            this.projectForm.enable();
          },
        });
    } else {
      console.log('Form Invalid');
      this.snackbarService.showSnackbar(
        'Please fix the errors in the form',
        'error'
      );
    }
  }

  private submitProjectUpdate(configId: number | null): void {
    const projectUpdate: Project = {
      ...this.data.project,
      ...this.projectForm.value,
      manager_llm_config: configId,
    };

    this.projectsService.updateProject(projectUpdate).subscribe({
      next: (updatedProject: Project) => {
        this.dialogRef.close(updatedProject);
      },
      error: (error: Error) => {
        console.error('Error updating project:', error);
        this.snackbarService.showSnackbar(
          'Failed to update project. Please try again.',
          'error'
        );
        this.projectForm.enable();
      },
    });
  }

  public onToggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

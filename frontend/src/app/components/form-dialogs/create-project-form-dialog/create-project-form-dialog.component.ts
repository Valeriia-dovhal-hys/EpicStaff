import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ProjectsService } from '../../../services/projects.service';
import { Project } from '../../../shared/models/project.model';
import { Router } from '@angular/router';
import { SharedSnackbarService } from '../../../services/snackbar/shared-snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';

import { EmbeddingModelsService } from '../../../services/embeddings.service';
import { LLM_Models_Service } from '../../../services/LLM_models.service';
import { EmbeddingModel } from '../../../shared/models/embedding.model';
import { LLM_Model } from '../../../shared/models/LLM.model';
import { forkJoin, Subscription } from 'rxjs';
import { LLM_Providers_Service } from '../../../services/LLM_providers.service';
import { LLM_Provider } from '../../../shared/models/LLM_provider.model';

@Component({
  selector: 'app-project-form',
  templateUrl: './create-project-form-dialog.component.html',
  styleUrls: ['./create-project-form-dialog.component.scss'],

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
export class CreateProjectFormDialogComponent implements OnInit, OnDestroy {
  public projectForm!: FormGroup;

  public processes = [
    { value: 'sequential', viewValue: 'Sequential' },
    { value: 'hierarchical', viewValue: 'Hierarchical' },
  ];

  // Data
  public LLM_providers: LLM_Provider[] = [];
  public embeddingModels: EmbeddingModel[] = [];
  public allLLMModels: LLM_Model[] = []; // Holds all LLM models
  public filteredLLMModels: LLM_Model[] = []; // Holds filtered LLM models

  // Selected Provider
  public selectedProviderId: number | null = null;

  // Visibility
  public isDataLoaded = false;
  public advancedSettingsVisible: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private snackbarService: SharedSnackbarService,
    public projectFormDialogRef: MatDialogRef<CreateProjectFormDialogComponent>,
    private embeddingModelsService: EmbeddingModelsService,
    private llmModelsService: LLM_Models_Service,
    private llmprovidersService: LLM_Providers_Service,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.loadModels();
  }

  private initializeForm(): void {
    this.projectForm = this.fb.group({
      name: [''],
      assignment: [''],
      description: [''],
      process: ['sequential', Validators.required],
      memory: ['false'],
      embedding_model: [null, Validators.required],
      manager_llm_model: [null, Validators.required],
      manager_llm_config: [2],
    });
  }

  private loadModels(): void {
    const modelsSubscription: Subscription = forkJoin({
      embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
      llmModels: this.llmModelsService.getLLMModels(),
      LLM_providers: this.llmprovidersService.getProviders(),
    }).subscribe({
      next: ({ embeddingModels, llmModels, LLM_providers }) => {
        this.embeddingModels = embeddingModels;
        this.allLLMModels = llmModels;
        this.LLM_providers = LLM_providers;

        // Set default provider
        if (this.LLM_providers.length > 0) {
          this.selectedProviderId = this.LLM_providers[0].id;
          this.filterLLMModelsByProvider(this.selectedProviderId);
        }

        // Set default embedding model
        if (this.embeddingModels.length > 0) {
          this.projectForm
            .get('embedding_model')
            ?.setValue(this.embeddingModels[0].id);
        }

        this.isDataLoaded = true;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        console.error('Error fetching models:', error);
        this.snackbarService.showSnackbar('Failed to load models.', 'error');
        this.isDataLoaded = true;
        this.cdr.markForCheck();
      },
    });

    this.subscriptions.add(modelsSubscription);
  }

  public onProviderChange(providerId: number): void {
    this.selectedProviderId = providerId;
    this.filterLLMModelsByProvider(providerId);
  }

  private filterLLMModelsByProvider(providerId: number): void {
    this.filteredLLMModels = this.allLLMModels.filter(
      (model: LLM_Model) => model.llm_provider === providerId
    );

    if (this.filteredLLMModels.length > 0) {
      this.projectForm
        .get('manager_llm_model')
        ?.setValue(this.filteredLLMModels[0].id);
    } else {
      this.projectForm.get('manager_llm_model')?.setValue(null);
    }
  }

  public onCancelForm(): void {
    this.projectFormDialogRef.close();
  }

  public onSubmitForm(): void {
    if (this.projectForm.valid) {
      const newProject: Project = {
        ...this.projectForm.value,
        // Include the selected provider ID in the project data if needed
        provider: this.selectedProviderId,
      };

      console.log(newProject);

      this.projectFormDialogRef.close(newProject);
    } else {
      console.log('Form Invalid');
      this.snackbarService.showSnackbar(
        'Please fix the errors in the form',
        'error'
      );
    }
  }

  public onToggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

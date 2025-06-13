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
  FormArray,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../shared/models/project.model';
import { Router } from '@angular/router';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef } from '@angular/material/dialog';

import { EmbeddingModelsService } from '../../services/embeddings.service';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { EmbeddingModel } from '../../shared/models/embedding.model';
import { LLM_Model } from '../../shared/models/LLM.model';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  public projectForm!: FormGroup;

  public processes = [
    { value: 'sequential', viewValue: 'Sequential' },
    { value: 'hierarchical', viewValue: 'Hierarchical' },
  ];
  public embeddingModels: EmbeddingModel[] = [];
  public manageLLMs: LLM_Model[] = [];

  public isDataLoaded = false;
  public advancedSettingsVisible: boolean = false;
  public variablesVisible: boolean = true;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private router: Router,
    private snackbarService: SharedSnackbarService,
    public projectFormDialogRef: MatDialogRef<ProjectFormComponent>,
    private embeddingModelsService: EmbeddingModelsService,
    private llmModelsService: LLM_Models_Service,
    private cdr: ChangeDetectorRef
  ) {
    // Removed form initialization from constructor
  }

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
      // variables: this.fb.array([]),
    });
  }

  private loadModels(): void {
    this.isDataLoaded = true;

    const modelsSubscription: Subscription = forkJoin({
      embeddingModels: this.embeddingModelsService.getEmbeddingModels(),
      llmModels: this.llmModelsService.getLLMModels(),
    }).subscribe({
      next: ({ embeddingModels, llmModels }) => {
        this.embeddingModels = embeddingModels;
        this.manageLLMs = llmModels;

        // Set default values if models are available
        if (this.embeddingModels.length > 0) {
          this.projectForm
            .get('embedding_model')
            ?.setValue(this.embeddingModels[0].id);
        }

        if (this.manageLLMs.length > 0) {
          this.projectForm
            .get('manager_llm_model')
            ?.setValue(this.manageLLMs[0].id);
        }

        this.isDataLoaded = false;
        this.cdr.markForCheck(); // Ensure change detection
      },
      error: (error: Error) => {
        console.error('Error fetching models:', error);
        this.snackbarService.showSnackbar('Failed to load models.', 'error');
        this.isDataLoaded = false;
        this.cdr.markForCheck(); // Ensure change detection
      },
    });

    this.subscriptions.add(modelsSubscription);
  }

  public get variables(): FormArray {
    return this.projectForm.get('variables') as FormArray;
  }

  public onCancelForm(): void {
    this.projectFormDialogRef.close();
  }

  public onSubmitForm(): void {
    if (this.projectForm.valid) {
      const newProject: Project = {
        ...this.projectForm.value,
      };
      console.log(newProject);

      this.projectFormDialogRef.close(newProject);
    } else {
      console.log('Form Invalid');
    }
  }

  public onAddVariable(): void {
    this.variables.push(
      this.fb.group({
        title: [`Variable ${this.variables.length + 1}`, Validators.required],
        value: [''],
      })
    );
  }

  public toggleVariablesVisibility(): void {
    this.variablesVisible = !this.variablesVisible;
  }

  public toggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

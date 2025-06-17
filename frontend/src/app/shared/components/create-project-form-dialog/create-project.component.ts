import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { DialogModule, DialogRef } from '@angular/cdk/dialog';
import { FormFooterComponent } from '../forms/footer/form-footer.component';
import { ProcessSelectorComponent } from '../forms/process-selector/process-selector.component';
import { NgIf } from '@angular/common';
import { FormHeaderComponent } from '../forms/header/form-header.component';
import { FormSliderComponent } from '../forms/slider/form-slider.component';
import {
  IconPickerComponent,
  UI_ICONS,
} from '../forms/icon-selector/icon-picker.component';

import { ToggleSwitchComponent } from '../forms/small-toggler/toggle-switch.component';
import { LlmSelectorComponent } from '../../../pages/staff-page/components/advanced-settings-dialog.component.ts/fcm-llm-selector/llm-selector.component';
import { EmbeddingSelectorComponent } from '../../../pages/knowledge-sources/components/create-collection-dialog/embeddings-dropdown/dropdown-picker.component';
import { FullLLMConfigService } from '../../../services/full-llm-config.service';
import { FullLLMConfig } from '../../../services/full-llm-config.service';
import {
  FullEmbeddingConfig,
  FullEmbeddingConfigService,
} from '../../../services/full-embedding.service';
import { Subject, takeUntil } from 'rxjs';
import {
  GetProjectRequest,
  CreateProjectRequest,
} from '../../../features/projects/models/project.model';
import { ProjectsStorageService } from '../../../features/projects/services/projects-storage.service';
import { ToastService } from '../../../services/notifications/toast.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.scss'],
  imports: [
    FormHeaderComponent,
    FormFooterComponent,
    DialogModule,
    ProcessSelectorComponent,
    NgIf,
    ReactiveFormsModule,
    FormSliderComponent,
    IconPickerComponent,
    ToggleSwitchComponent,
    LlmSelectorComponent,
    EmbeddingSelectorComponent,
  ],
  animations: [
    trigger('smoothExpand', [
      state(
        'void',
        style({
          maxHeight: '0',
          overflow: 'hidden',
          opacity: 0,
          padding: '0',
        })
      ),
      state(
        '*',
        style({
          maxHeight: '1000px',
          overflow: 'visible', // Changed from 'hidden' to 'visible'
          opacity: 1,
        })
      ),
      transition('void => *', [
        style({
          maxHeight: '0',
          overflow: 'hidden',
          opacity: 0,
          padding: '0',
        }),
        animate(
          '300ms ease-out',
          style({
            maxHeight: '1000px',
            opacity: 1,
            padding: '*',
            overflow: 'visible', // Added to ensure overflow is visible at the end
          })
        ),
      ]),
      transition('* => void', [
        style({
          maxHeight: '*',
          overflow: 'hidden', // Keep as hidden during collapse
          opacity: 1,
        }),
        animate(
          '300ms ease-in',
          style({
            maxHeight: '0',
            opacity: 0,
            padding: '0',
          })
        ),
      ]),
    ]),
  ],
})
export class CreateProjectComponent implements OnInit, OnDestroy {
  public projectForm: FormGroup;
  public advancedVisible = false;
  public sliderValue = 0;
  public maxRpmSliderValue = 10; // Default to middle of 0-50 range

  // Updated to use the full config services
  public llmConfigs: FullLLMConfig[] = [];
  public embeddingConfigs: FullEmbeddingConfig[] = [];

  // Icon Picker property
  public selectedIcon: string | null = 'star'; // Default icon

  // Active color for consistency with design patterns
  public get activeColor(): string {
    return '#685fff'; // Default accent color
  }

  // For managing RxJS subscriptions
  private destroy$ = new Subject<void>();

  public isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<GetProjectRequest | undefined>, // Update the generic type
    private fullLlmConfigService: FullLLMConfigService,
    private fullEmbeddingConfigService: FullEmbeddingConfigService,
    private projectsService: ProjectsStorageService,
    private toastService: ToastService // Updated to use ToastService
  ) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      process_type: ['sequential'],
      manager_llm_config: [null],
      embedding_config: [null],
      planning_llm_config: [null], // Default to some neutral value
      default_temperature: [0],
      memory: [true],
      cache: [true], // Default to true (neutral value)
      full_output: [true], // Default to true (neutral value)
      planning: [false],
      project_icon: ['ui/star'], // Default icon path

      tasks: [[]],
      agents: [[]],
      config: [null],
      max_rmp: [10],
    });
  }

  public ngOnInit(): void {
    // Fetch LLM configs using service
    this.fullLlmConfigService
      .getFullLLMConfigs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          this.llmConfigs = configs;
        },
        error: (error) => {
          console.error('Error fetching LLM configs:', error);
        },
      });

    // Fetch embedding configs using service
    this.fullEmbeddingConfigService
      .getFullEmbeddingConfigs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          this.embeddingConfigs = configs;
        },
        error: (error) => {
          console.error('Error fetching embedding configs:', error);
        },
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onToggleAdvancedSettings(): void {
    this.advancedVisible = !this.advancedVisible;
  }

  public setProcessType(type: string): void {
    this.projectForm.get('process_type')?.setValue(type);
  }

  public onLLMChange(value: number | null): void {
    console.log('Selected LLM Config ID:', value);
    this.projectForm.get('manager_llm_config')?.setValue(value);
  }

  public onEmbeddingChange(value: number | null): void {
    console.log('Selected Embedding Config ID:', value);
    this.projectForm.get('embedding_config')?.setValue(value);
  }

  public onSliderInput(newValue: number): void {
    this.sliderValue = newValue;
    this.projectForm.get('default_temperature')?.setValue(newValue / 100);
  }

  public onMaxRpmSliderInput(newValue: number): void {
    this.maxRpmSliderValue = newValue;
    this.projectForm.get('max_rmp')?.setValue(newValue);
  }

  public onIconSelected(icon: string | null): void {
    this.selectedIcon = icon;
    // Get the full icon path from the UI_ICONS dictionary
    const fullIconPath = icon ? this.getIconPath(icon) : '';
    this.projectForm.get('project_icon')?.setValue(fullIconPath);
    console.log('Icon selected:', icon, 'Path:', fullIconPath);
  }

  private getIconPath(iconName: string): string {
    // Use the imported UI_ICONS dictionary
    return UI_ICONS[iconName] || '';
  }

  // Updated onCancelForm method to just close the dialog
  public onCancelForm(): void {
    this.dialogRef.close(undefined);
  }

  public onSubmitForm(): void {
    if (this.projectForm.valid) {
      this.isSubmitting = true;
      // Convert slider value (0-100) to temperature value (0-1)
      const temperatureValue = this.sliderValue / 100;

      // Construct the project request
      const projectRequest: CreateProjectRequest = {
        // Basic info
        name: this.projectForm.get('name')?.value,
        description: this.projectForm.get('description')?.value || null,

        // Process type (must be 'sequential' or 'hierarchical')
        process: this.projectForm.get('process_type')?.value,

        // Optional config fields
        memory: this.projectForm.get('memory')?.value || null,
        cache: this.projectForm.get('cache')?.value || null,
        full_output: this.projectForm.get('full_output')?.value,
        planning: this.projectForm.get('planning')?.value || false,

        // Temperature (normalized from slider)
        default_temperature: temperatureValue,

        // Configuration-related fields
        manager_llm_config:
          this.projectForm.get('manager_llm_config')?.value || null,
        embedding_config:
          this.projectForm.get('embedding_config')?.value || null,
        planning_llm_config:
          this.projectForm.get('planning_llm_config')?.value || null,

        // Additional fields
        tasks: this.projectForm.get('tasks')?.value,
        agents: this.projectForm.get('agents')?.value,
        config: this.projectForm.get('config')?.value,
        max_rmp: this.projectForm.get('max_rmp')?.value,

        // Icon metadata
        metadata: {
          icon: this.projectForm.get('project_icon')?.value || 'ui/star',
        },
      };

      console.log('Submitting project data:', projectRequest);

      // Send the create project request using ProjectsService
      this.projectsService.createProject(projectRequest).subscribe({
        next: (project: GetProjectRequest) => {
          console.log('Project created successfully:', project);
          this.isSubmitting = false;
          this.toastService.success(
            `Project "${project.name}" created successfully!`
          );

          this.dialogRef.close(project);
        },
        error: (error) => {
          this.isSubmitting = false;

          console.error('Error creating project:', error);

          this.toastService.error(
            `Failed to delete project: ${error.message || 'Unknown error'}`
          );
        },
      });
    } else {
      // Mark all form controls as touched to show validation errors
      this.markFormGroupTouched(this.projectForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}

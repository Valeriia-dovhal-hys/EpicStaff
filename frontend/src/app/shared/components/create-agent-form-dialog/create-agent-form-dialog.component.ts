import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { map, Subscription, switchMap, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';

import { RealtimeAgentService } from '../../../services/realtime-agent.service';
import { IconPickerComponent } from '../forms/icon-selector/icon-picker.component';
import { ToggleSwitchComponent } from '../forms/small-toggler/toggle-switch.component';
import { FormHeaderComponent } from '../forms/header/form-header.component';
import { FormFooterComponent } from '../forms/footer/form-footer.component';
import { FormSliderComponent } from '../forms/slider/form-slider.component';
import { LlmSelectorComponent } from '../../../pages/staff-page/components/advanced-settings-dialog.component.ts/fcm-llm-selector/llm-selector.component';
import { AgentsService } from '../../../services/staff.service';
import { ToastService } from '../../../services/notifications/toast.service';
import { ShortcutListenerDirective } from '../../../visual-programming/core/directives/shortcut-listener.directive';
import {
  FullLLMConfigService,
  FullLLMConfig,
} from '../../../services/full-llm-config.service';
import {
  AgentDto,
  CreateAgentRequest,
  GetAgentRequest,
} from '../../models/agent.model';

@Component({
  selector: 'app-create-agent-form',
  templateUrl: './create-agent-form-dialog.component.html',
  styleUrls: ['./create-agent-form-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    FormHeaderComponent,
    FormFooterComponent,
    FormSliderComponent,
    ToggleSwitchComponent,

    IconPickerComponent,
    LlmSelectorComponent,
    ShortcutListenerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          overflow: 'visible',
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
            overflow: 'visible',
          })
        ),
      ]),
      transition('* => void', [
        style({
          maxHeight: '*',
          overflow: 'hidden',
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
export class CreateAgentFormComponent implements OnInit, OnDestroy {
  public agentForm!: FormGroup;

  public advancedSettingsVisible: boolean = false;
  public temperatureValue: number = 0;
  public maxRpmSliderValue: number = 10;
  public isSubmitting: boolean = false;

  private subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  // Icon Picker property
  public selectedIcon: string | null = null;

  // LLM configurations
  public availableLLMConfigs: FullLLMConfig[] = [];

  // Active color for consistency with python-node design
  public get activeColor(): string {
    return '#685fff'; // Default accent color
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private agentService: AgentsService,
    private realtimeAgentService: RealtimeAgentService,
    private toastService: ToastService,
    private fullLLMConfigService: FullLLMConfigService,
    public dialogRef: DialogRef<GetAgentRequest | undefined>
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.loadLLMConfigs();
  }

  private initializeForm(): void {
    this.agentForm = this.fb.group({
      // Basic Fields
      role: ['', Validators.required],
      goal: ['', Validators.required],
      backstory: ['', Validators.required],
      // Basic Advanced Fields
      allow_delegation: [true],
      memory: [false],
      max_iter: [10, [Validators.min(1)]],
      // Advanced Settings
      max_rpm: [10],
      max_execution_time: [60],
      cache: [false],
      allow_code_execution: [false],
      max_retry_limit: [3],
      respect_context_window: [true],
      default_temperature: [0],
      // LLM Configurations
      llm_config: [null],
      fcm_llm_config: [null],
      // Tools
      configured_tools: [[]],
      python_code_tools: [[]],
    });
  }

  private loadLLMConfigs(): void {
    this.fullLLMConfigService
      .getFullLLMConfigs()
      .pipe(takeUntil(this.destroy$))
      .subscribe((configs: FullLLMConfig[]) => {
        this.availableLLMConfigs = configs;
        this.cdr.markForCheck();
      });
  }

  public onSliderInput(newValue: number): void {
    this.temperatureValue = newValue;
    this.agentForm.get('default_temperature')?.setValue(newValue);
    this.cdr.markForCheck();
  }

  public onMaxRpmSliderInput(newValue: number): void {
    this.maxRpmSliderValue = newValue;
    this.agentForm.get('max_rpm')?.setValue(newValue);
    this.cdr.markForCheck();
  }

  public toggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
    this.cdr.markForCheck();
  }

  public onIconSelected(icon: string | null): void {
    console.log(icon);
  }

  public onSubmitForm(): void {
    if (this.agentForm.invalid) {
      this.markFormGroupTouched(this.agentForm);
      return;
    }

    this.isSubmitting = true;
    const formData = this.agentForm.value;

    const newAgent: CreateAgentRequest = {
      role: formData.role,
      goal: formData.goal,
      backstory: formData.backstory,
      allow_delegation: formData.allow_delegation,
      memory: formData.memory,
      max_iter: formData.max_iter,
      max_rpm: formData.max_rpm,
      max_execution_time: formData.max_execution_time,
      cache: formData.cache,
      allow_code_execution: formData.allow_code_execution,
      max_retry_limit: formData.max_retry_limit,
      respect_context_window: formData.respect_context_window,
      default_temperature: formData.default_temperature,
      llm_config: formData.llm_config,
      fcm_llm_config: formData.fcm_llm_config || formData.llm_config, // Use llm_config if fcm_llm_config is not provided
      configured_tools: formData.configured_tools,
      python_code_tools: formData.python_code_tools,
    };

    this.agentForm.disable();

    this.agentService.createAgent(newAgent).subscribe({
      next: (response: AgentDto) => {
        this.toastService.success(
          `Agent "${response.role}" created successfully!`
        );
        this.isSubmitting = false;
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error creating agent:', error);
        const errorMsg =
          error.status === 400
            ? 'Validation error. Please check your inputs.'
            : 'Error creating agent. Please try again.';

        this.toastService.error(errorMsg);
        this.agentForm.enable();
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  public onCancelForm(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

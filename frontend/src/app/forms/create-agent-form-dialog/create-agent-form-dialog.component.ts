// Import statements
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Tool } from '../../shared/models/tool.model';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ToolSelectorComponent } from '../../main/tools-selector-dialog/tool-selector-dialog.component';
import { LLM_Model } from '../../shared/models/LLM.model';
import { forkJoin, Subscription } from 'rxjs';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { LLM_Providers_Service } from '../../services/LLM_providers.service';
import { LLM_Provider } from '../../shared/models/LLM_provider.model';
import { LLM_Config_Service } from '../../services/LLM_config.service';
import { CreateLLMConfigRequest } from '../../shared/models/LLM_config.model';
import { LLM_Config } from '../../shared/models/LLM_config.model'; // Import the model
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { CreateAgentRequest } from '../../shared/models/agent.model';

@Component({
  selector: 'app-create-agent-form',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatCheckbox,
    CommonModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatError,
    MatInput,
    MatIcon,
    MatChipsModule,
    FormsModule, // Include FormsModule
  ],
  templateUrl: './create-agent-form-dialog.component.html',
  styleUrls: ['./create-agent-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAgentFormComponent implements OnInit, OnDestroy {
  public agentForm!: FormGroup;

  // Data
  private toolsData: Tool[] = [];
  public selectedTools: Tool[] = [];

  public providers: LLM_Provider[] = [];
  public selectedAgentProviderId: number | null = null;
  public selectedFunctionProviderId: number | null = null;

  public llmModels: LLM_Model[] = [];
  public filteredAgentLLMModels: LLM_Model[] = [];
  public filteredFunctionLLMModels: LLM_Model[] = [];

  // Visibility
  public advancedSettingsVisible: boolean = false;
  public isDataLoaded: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public agentFormDialogRef: MatDialogRef<CreateAgentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { toolsData: Tool[] },
    private fb: FormBuilder,
    private dialog: MatDialog,
    private llmModelsService: LLM_Models_Service,
    private providersService: LLM_Providers_Service,
    private cdr: ChangeDetectorRef,
    private llmConfigService: LLM_Config_Service // Inject the service
  ) {
    this.toolsData = data.toolsData;
  }

  public ngOnInit(): void {
    this.initializeForm();
    this.loadModels();
  }

  // Initialize Form
  private initializeForm(): void {
    this.agentForm = this.fb.group({
      role: ['', Validators.required],
      goal: ['', Validators.required],
      backstory: ['', Validators.required],
      allowDelegation: [true, Validators.required],
      memory: [false, Validators.required],
      max_iter: [15, [Validators.required, Validators.min(1)]],
      llm_model: [null, Validators.required],
      fcm_llm_model: [null, Validators.required],
      llm_config: [null],
      fcm_llm_config: [null],

      temperature: [
        0.7,
        [Validators.required, Validators.min(0), Validators.max(1)],
      ],
      num_ctx: [25, [Validators.required, Validators.min(0)]],
    });
  }

  // Load LLM models and providers
  private loadModels(): void {
    const modelsSubscription: Subscription = forkJoin({
      llmModels: this.llmModelsService.getLLMModels(),
      providers: this.providersService.getProviders(),
    }).subscribe({
      next: ({ llmModels, providers }) => {
        this.llmModels = llmModels;
        this.providers = providers;

        // Set default provider
        if (this.providers.length > 0) {
          this.selectedAgentProviderId = this.providers[0].id;
          this.selectedFunctionProviderId = this.providers[0].id;
        }

        this.filterAgentLLMModels();
        this.filterFunctionLLMModels();

        // Set default LLM models
        if (this.filteredAgentLLMModels.length > 0) {
          this.agentForm
            .get('llm_model')
            ?.setValue(this.filteredAgentLLMModels[0].id);
        }

        if (this.filteredFunctionLLMModels.length > 0) {
          this.agentForm
            .get('fcm_llm_model')
            ?.setValue(this.filteredFunctionLLMModels[0].id);
        }

        this.isDataLoaded = true;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        console.error('Error fetching data:', error);
        this.isDataLoaded = true;
        this.cdr.markForCheck();
      },
    });

    this.subscriptions.add(modelsSubscription);
  }

  public onAgentProviderChange(providerId: number): void {
    this.selectedAgentProviderId = providerId;
    this.filterAgentLLMModels();
  }

  public onFunctionProviderChange(providerId: number): void {
    this.selectedFunctionProviderId = providerId;
    this.filterFunctionLLMModels();
  }

  private filterAgentLLMModels(): void {
    this.filteredAgentLLMModels = this.llmModels.filter(
      (model: LLM_Model) => model.llm_provider === this.selectedAgentProviderId
    );

    if (this.filteredAgentLLMModels.length > 0) {
      this.agentForm
        .get('llm_model')
        ?.setValue(this.filteredAgentLLMModels[0].id);
    } else {
      this.agentForm.get('llm_model')?.setValue(null);
    }
  }

  private filterFunctionLLMModels(): void {
    this.filteredFunctionLLMModels = this.llmModels.filter(
      (model: LLM_Model) =>
        model.llm_provider === this.selectedFunctionProviderId
    );

    if (this.filteredFunctionLLMModels.length > 0) {
      this.agentForm
        .get('fcm_llm_model')
        ?.setValue(this.filteredFunctionLLMModels[0].id);
    } else {
      this.agentForm.get('fcm_llm_model')?.setValue(null);
    }
  }

  public toggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
  }

  public openToolSelectorDialog(): void {
    const dialogRef = this.dialog.open(ToolSelectorComponent, {
      data: {
        toolsData: this.toolsData,
        selectedTools: this.selectedTools,
      },
    });

    dialogRef.afterClosed().subscribe((selectedTools: Tool[] | undefined) => {
      if (selectedTools) {
        this.selectedTools = [...selectedTools];
        this.cdr.markForCheck();
      }
    });
  }

  public onRemoveTool(selectedTool: Tool): void {
    this.selectedTools = this.selectedTools.filter(
      (tool: Tool) => tool.id !== selectedTool.id
    );
  }

  public onCancelForm(): void {
    this.agentFormDialogRef.close();
  }

  public onSubmitForm(): void {
    this.agentForm.markAllAsTouched();

    if (this.agentForm.valid) {
      this.agentForm.disable();
      const configData: CreateLLMConfigRequest = {
        temperature: this.agentForm.value.temperature,
        num_ctx: this.agentForm.value.num_ctx,
      };

      this.llmConfigService.createConfig(configData).subscribe({
        next: (createdConfig: LLM_Config) => {
          const configId: number = createdConfig.id;

          const { temperature, num_ctx, ...agentFormData } =
            this.agentForm.value;

          const newAgent: CreateAgentRequest = {
            ...agentFormData,
            tools: this.selectedTools.map((tool: Tool) => tool.id),
            llm_config: configId,
            fcm_llm_config: configId,
          };

          console.log(newAgent);

          this.agentFormDialogRef.close(newAgent);
        },
        error: (error: Error) => {
          console.error('Error creating LLM config:', error);
          // Handle error (e.g., display a message to the user)
        },
      });
    } else {
      console.log('Form Invalid');
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

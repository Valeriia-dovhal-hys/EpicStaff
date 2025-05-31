// create-agent-form.component.ts
import {
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
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Agent, LLM } from '../../../shared/models/agent.model';
import { Tool } from '../../../shared/models/tool.model';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ToolSelectorComponent } from '../../../main/tools-selector-dialog/tool-selector-dialog.component';
import { LLMModel } from '../../../shared/models/LLM.model';
import { Subscription } from 'rxjs';
import { LLMModelsService } from '../../../services/llm.service';
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
  ],
  templateUrl: './create-agent-form.component.html',
  styleUrls: ['./create-agent-form.component.scss'],
})
export class CreateAgentFormComponent implements OnInit, OnDestroy {
  public agentForm!: FormGroup;

  // Data
  private toolsData: Tool[] = [];
  public llmModels: LLMModel[] = [];
  public selectedTools: Tool[] = [];

  // Visibility
  public advancedSettingsVisible: boolean = false;
  public isDataLoaded: boolean = false;

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    public agentFormDialogRef: MatDialogRef<CreateAgentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { toolsData: Tool[] },
    private fb: FormBuilder,
    private dialog: MatDialog,
    private llmModelsService: LLMModelsService,
    private cdr: ChangeDetectorRef
  ) {
    this.toolsData = data.toolsData;
    console.log(this.toolsData);
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
      llm_config: [2],
      fcm_llm_config: [2],
    });
  }

  // Load LLM models and set default LLM value in form
  private loadModels(): void {
    this.isDataLoaded = true;

    const modelsSubscription: Subscription = this.llmModelsService
      .getLLMModels()
      .subscribe({
        next: (llmModels: LLMModel[]) => {
          this.llmModels = llmModels;

          // Set default values (currently the first fetched)
          if (this.llmModels.length > 0) {
            this.agentForm.get('llm_model')?.setValue(this.llmModels[0].id);
            this.agentForm.get('fcm_llm_model')?.setValue(this.llmModels[0].id);
          }

          this.isDataLoaded = false;
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error fetching LLM models:', error);

          this.isDataLoaded = false;
          this.cdr.markForCheck();
        },
      });

    this.subscriptions.add(modelsSubscription);
  }

  public toggleAdvancedSettings(): void {
    this.advancedSettingsVisible = !this.advancedSettingsVisible;
  }

  public openToolSelectorDialog(): void {
    console.log(this.toolsData);
    const dialogRef = this.dialog.open(ToolSelectorComponent, {
      maxHeight: 'none',
      maxWidth: 'none',
      data: {
        toolsData: this.toolsData, // All available tools
        selectedTools: this.selectedTools, // Currently selected tools
      },
    });

    dialogRef.afterClosed().subscribe((selectedTools: Tool[] | undefined) => {
      if (selectedTools) {
        this.selectedTools = selectedTools;
        // Update your component's state or form control as needed
      }
    });
  }

  public onRemoveTool(tool: Tool): void {
    const index = this.selectedTools.indexOf(tool);

    if (index >= 0) {
      this.selectedTools.splice(index, 1);
      this.cdr.markForCheck(); // Ensure change detection
    }
  }

  public onCancelForm(): void {
    this.agentFormDialogRef.close();
  }

  public onSubmitForm(): void {
    if (this.agentForm.valid) {
      console.log('this is form value', this.agentForm.value);

      // Prepare the agent data with tools as an array of IDs
      const newAgent = {
        ...this.agentForm.value,
        tools: this.selectedTools.map((tool) => tool.id), // Convert tools to their IDs
      };

      console.log(newAgent);

      // Close the dialog and pass the agent data
      this.agentFormDialogRef.close(newAgent);
    } else {
      console.log('Form Invalid');
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

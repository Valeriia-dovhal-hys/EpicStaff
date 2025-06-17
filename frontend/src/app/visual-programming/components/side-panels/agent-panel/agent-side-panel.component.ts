import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AgentNodeModel } from '../../../core/models/node.model';
import { NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-agent-side-panel',
  standalone: true,
  templateUrl: './agent-edit-dialog.component.html',
  styleUrls: ['./agent-edit-dialog.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, NgIf],
  animations: [
    trigger('expandInOut', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentSidePanelComponent implements OnInit {
  // Standardize input as "node" (of type AgentNodeModel)
  @Input() node!: AgentNodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<AgentNodeModel>();

  public agentForm!: FormGroup;
  public advancedSettingsOpen: boolean = false;
  public sliderValue: number = 50; // for default_temperature

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize basic fields plus advanced fields
    this.agentForm = this.fb.group({
      // Basic fields
      role: [this.node.data.role, Validators.required],
      goal: [this.node.data.goal],
      backstory: [this.node.data.backstory],
      // Advanced fields:
      allow_delegation: [this.node.data.allow_delegation, Validators.required],
      memory: [this.node.data.memory, Validators.required],
      max_iter: [
        this.node.data.max_iter,
        [Validators.required, Validators.min(1)],
      ],
      max_rpm: [this.node.data.max_rpm],
      max_execution_time: [this.node.data.max_execution_time],
      cache: [this.node.data.cache, Validators.required],
      allow_code_execution: [
        this.node.data.allow_code_execution,
        Validators.required,
      ],
      max_retry_limit: [this.node.data.max_retry_limit],
      respect_context_window: [
        this.node.data.respect_context_window,
        Validators.required,
      ],
      default_temperature: [
        this.node.data.default_temperature,
        Validators.required,
      ],
    });
    this.sliderValue = this.node.data.default_temperature || 50;
  }

  onSliderInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.sliderValue = +inputElement.value;
    this.agentForm.patchValue({ default_temperature: this.sliderValue });
  }

  toggleAdvancedSettings(): void {
    this.advancedSettingsOpen = !this.advancedSettingsOpen;
  }

  onSubmit(): void {
    if (this.agentForm.valid) {
      // Merge the form values into node.data and set extra fields as needed.
      const updatedNode: AgentNodeModel = {
        ...this.node,
        data: {
          ...this.node.data,
          ...this.agentForm.getRawValue(),
          // Set fields not handled by the form:
          configured_tools: [],
          python_code_tools: [],
          llm_config: null,
          fcm_llm_config: null,
        },
      };
      this.nodeUpdated.emit(updatedNode);
      this.close();
    }
  }

  close(): void {
    this.closePanel.emit();
  }
}

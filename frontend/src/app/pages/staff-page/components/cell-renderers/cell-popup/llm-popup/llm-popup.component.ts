import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FullLLMConfigService } from '../../../../../../services/full-llm-config.service';
import { FullRealtimeConfigService } from '../../../../../models-page/services/realtime-models-services/full-reamtime-config.service';

interface MergedConfig {
  id: number;
  custom_name: string;
  model_name: string;
  type: string;
}

@Component({
  selector: 'app-llm-popup',
  standalone: true,
  imports: [NgFor, FormsModule, NgIf, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="llm-list-container">
      <div class="list-header">
        <input
          #searchInput
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Search models..."
        />
        <button class="filter-button">
          <i class="ti ti-filter"></i>
          Filter
        </button>
      </div>

      <div class="tabs-header">
        <div
          class="tab"
          [ngClass]="{ active: activeTab === 'llm' }"
          (click)="setActiveTab('llm')"
        >
          LLM Models
        </div>
        <div
          class="tab"
          [ngClass]="{ active: activeTab === 'realtime' }"
          (click)="setActiveTab('realtime')"
        >
          Realtime Models
        </div>
      </div>

      <!-- LLM Models Tab -->
      <div class="llm-list-wrapper" *ngIf="activeTab === 'llm'">
        <ul class="llms-list">
          <li
            class="llm-item"
            *ngFor="let item of filteredLLMs"
            (click)="onSelectLLM(item)"
            (keydown.enter)="onSelectLLM(item)"
            [class.selected]="selectedLLMId === item.id"
            tabindex="0"
          >
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/021/059/825/small_2x/chatgpt-logo-chat-gpt-icon-on-green-background-free-vector.jpg"
              alt="LLM Logo"
              class="chatgpt-logo"
            />

            <div class="item-content">
              <div class="item-text">
                <div class="model-name">
                  {{ getModelName(item) }}
                </div>
                <div class="custom-name">{{ item.custom_name }}</div>
              </div>
            </div>

            <button
              class="select-button"
              [title]="
                selectedLLMId === item.id
                  ? 'Deselect this LLM configuration'
                  : 'Select this LLM configuration'
              "
            >
              <i
                [class]="selectedLLMId === item.id ? 'ti ti-x' : 'ti ti-plus'"
              ></i>
            </button>
          </li>

          <!-- No results message -->
          <li class="no-results" *ngIf="filteredLLMs.length === 0">
            <div class="empty-state">
              <i class="ti ti-search-off"></i>
              <p>No matching LLM configurations found</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Realtime Models Tab -->
      <div class="llm-list-wrapper" *ngIf="activeTab === 'realtime'">
        <ul class="llms-list">
          <li
            class="llm-item"
            *ngFor="let item of filteredRealtimeModels"
            (click)="onSelectRealtime(item)"
            (keydown.enter)="onSelectRealtime(item)"
            [class.selected]="selectedRealtimeId === item.id"
            tabindex="0"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/6295/6295417.png"
              alt="Realtime Logo"
              class="chatgpt-logo"
            />

            <div class="item-content">
              <div class="item-text">
                <div class="model-name">
                  {{ getModelName(item) }}
                </div>
                <div class="custom-name">{{ item.custom_name }}</div>
              </div>
            </div>

            <button
              class="select-button"
              [title]="
                selectedRealtimeId === item.id
                  ? 'Deselect this Realtime configuration'
                  : 'Select this Realtime configuration'
              "
            >
              <i
                [class]="
                  selectedRealtimeId === item.id ? 'ti ti-x' : 'ti ti-plus'
                "
              ></i>
            </button>
          </li>

          <!-- No results message -->
          <li class="no-results" *ngIf="filteredRealtimeModels.length === 0">
            <div class="empty-state">
              <i class="ti ti-search-off"></i>
              <p>No matching Realtime configurations found</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Controls footer -->
      <div class="controls-footer">
        <button class="cancel-button" (click)="onCancel()">Cancel</button>
        <button class="save-button" (click)="onSave()">Save</button>
      </div>
    </div>
  `,
  styleUrls: ['./llm-popup.component.scss'],
})
export class LLMPopupComponent implements OnInit, OnChanges, OnDestroy {
  public searchTerm: string = '';
  public activeTab: 'llm' | 'realtime' = 'llm';

  // LLM Models
  public llmConfigs: any[] = [];
  public selectedLLMId: number | null = null;
  public selectedLLM: any = null;

  // Realtime Models
  public realtimeConfigs: any[] = [];
  public selectedRealtimeId: number | null = null;
  public selectedRealtime: any = null;

  // Input/Output
  @Input() public cellValue: any = null;
  @Output() public configsSelected = new EventEmitter<MergedConfig[]>();
  @Output() public cancel = new EventEmitter<void>();

  @ViewChild('searchInput')
  public searchInput: ElementRef<HTMLInputElement> | null = null;

  private readonly destroyed$ = new Subject<void>();

  constructor(
    private readonly fullLLMConfigService: FullLLMConfigService,
    private readonly fullRealtimeConfigService: FullRealtimeConfigService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.loadConfigs();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['cellValue']) {
      this.preSelectConfigs();
    }
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  // Load all configurations from services
  private loadConfigs(): void {
    // Load LLM configs
    this.fullLLMConfigService
      .getFullLLMConfigs()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (configs) => {
          this.llmConfigs = configs;
          this.preSelectConfigs();
          this.cdr.markForCheck();

          // Auto-focus search input
          if (this.searchInput) {
            this.searchInput.nativeElement.focus();
          }
        },
        error: (err) => console.error('Error fetching LLM configs:', err),
      });

    // Load Realtime configs
    this.fullRealtimeConfigService
      .getFullRealtimeConfigs()
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (data) => {
          this.realtimeConfigs = data.fullConfigs;
          this.preSelectConfigs();
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error fetching Realtime configs:', err),
      });
  }

  // Preselect configs based on cell value
  private preSelectConfigs(): void {
    // Reset selections
    this.selectedLLMId = null;
    this.selectedLLM = null;
    this.selectedRealtimeId = null;
    this.selectedRealtime = null;

    // Return if no cell value or configs not loaded yet
    if (
      !this.cellValue ||
      (!this.llmConfigs.length && !this.realtimeConfigs.length)
    ) {
      return;
    }

    const configs = Array.isArray(this.cellValue)
      ? this.cellValue
      : [this.cellValue];

    // Find selected configs
    configs.forEach((config) => {
      if (config.type === 'llm-config' && this.llmConfigs.length) {
        this.selectedLLMId = config.id;
        this.selectedLLM =
          this.llmConfigs.find((c) => c.id === config.id) || null;
      } else if (
        config.type === 'realtime-config' &&
        this.realtimeConfigs.length
      ) {
        this.selectedRealtimeId = config.id;
        this.selectedRealtime =
          this.realtimeConfigs.find((c) => c.id === config.id) || null;
      }
    });
  }

  // Get model name from config (works for both LLM and Realtime)
  public getModelName(config: any): string {
    // Try to get name from modelDetails if it exists (old structure)
    if (config.modelDetails?.name) {
      return config.modelDetails.name;
    }

    // Try to get name from modelName property (new structure)
    if (config.modelName) {
      return config.modelName;
    }

    return 'Unknown';
  }

  // Tab switching
  public setActiveTab(tab: 'llm' | 'realtime'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  // Filtered LLMs for search
  public get filteredLLMs(): any[] {
    if (!this.searchTerm) {
      return this.llmConfigs;
    }

    const term = this.searchTerm.toLowerCase();
    return this.llmConfigs.filter((item) => {
      const modelName = this.getModelName(item).toLowerCase();
      const customName = (item.custom_name || '').toLowerCase();

      return modelName.includes(term) || customName.includes(term);
    });
  }

  // Filtered Realtime models for search
  public get filteredRealtimeModels(): any[] {
    if (!this.searchTerm) {
      return this.realtimeConfigs;
    }

    const term = this.searchTerm.toLowerCase();
    return this.realtimeConfigs.filter((item) => {
      const modelName = this.getModelName(item).toLowerCase();
      const customName = (item.custom_name || '').toLowerCase();

      return modelName.includes(term) || customName.includes(term);
    });
  }

  // LLM selection handler
  public onSelectLLM(item: any): void {
    // Toggle selection
    if (this.selectedLLMId === item.id) {
      this.selectedLLMId = null;
      this.selectedLLM = null;
    } else {
      this.selectedLLMId = item.id;
      this.selectedLLM = item;
    }
    this.cdr.markForCheck();
  }

  // Realtime selection handler
  public onSelectRealtime(item: any): void {
    // Toggle selection
    if (this.selectedRealtimeId === item.id) {
      this.selectedRealtimeId = null;
      this.selectedRealtime = null;
    } else {
      this.selectedRealtimeId = item.id;
      this.selectedRealtime = item;
    }
    this.cdr.markForCheck();
  }

  // Save selections and emit back to parent
  public onSave(): void {
    const mergedConfigs: MergedConfig[] = [];

    // Add LLM config if selected
    if (this.selectedLLM) {
      mergedConfigs.push({
        id: this.selectedLLM.id,
        custom_name: this.selectedLLM.custom_name,
        model_name: this.getModelName(this.selectedLLM),
        type: 'llm-config',
      });
    }

    // Add Realtime config if selected
    if (this.selectedRealtime) {
      mergedConfigs.push({
        id: this.selectedRealtime.id,
        custom_name: this.selectedRealtime.custom_name,
        model_name: this.getModelName(this.selectedRealtime),
        type: 'realtime-config',
      });
    }

    // Emit the merged configs
    this.configsSelected.emit(mergedConfigs);
    this.cancel.emit();
  }

  // Cancel handler
  public onCancel(): void {
    this.cancel.emit();
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullLLMConfig } from '../../../../../../services/full-llm-config.service';

@Component({
  selector: 'app-model-dropdown-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dropdown-menu">
      <div class="dropdown-header">
        <div class="search-container">
          <input
            type="text"
            placeholder="Search models..."
            [(ngModel)]="searchTerm"
            (input)="filterModels()"
            (click)="$event.stopPropagation()"
          />
        </div>
        <div class="filter-button" (click)="$event.stopPropagation()">
          <i class="ti ti-filter"></i>
          <span>Filter</span>
        </div>
      </div>

      <div class="dropdown-items-container">
        <div
          *ngFor="let model of filteredModels"
          class="dropdown-item"
          [class.selected]="model.id === selectedModelId"
          (click)="selectModel(model); $event.stopPropagation()"
        >
          <div class="model-info">
            <img
              class="model-icon"
              src="assets/icons/openai-logo.svg"
              alt="Model icon"
            />
            <div class="model-name">
              {{ model.modelDetails?.name || 'Unknown model' }}
              <div class="model-custom-name" *ngIf="model.custom_name">
                {{ model.custom_name }}
              </div>
            </div>
          </div>
          <i class="ti ti-check" *ngIf="model.id === selectedModelId"></i>
        </div>

        <div class="no-results" *ngIf="filteredModels.length === 0">
          No models found
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        width: 100%;
      }
      .dropdown-menu {
        width: 100%;
        background-color: var(--gray-850);
        border-radius: 8px;
        border: 1px solid var(--gray-700);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        overflow: hidden;

        .dropdown-header {
          display: flex;
          padding: 10px;
          border-bottom: 1px solid var(--gray-800);

          .search-container {
            flex: 1;
            margin-right: 10px;

            input {
              width: 100%;
              padding: 6px 10px;
              background-color: var(--gray-800);
              border: 1px solid var(--gray-700);
              border-radius: 4px;
              color: var(--white);
              font-size: 12px;

              &::placeholder {
                color: var(--gray-500);
              }

              &:focus {
                outline: none;
                border-color: var(--accent-color);
              }
            }
          }

          .filter-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px 10px;
            background-color: var(--gray-800);
            border-radius: 4px;
            cursor: pointer;

            i {
              font-size: 12px;
              margin-right: 5px;
              color: var(--gray-400);
            }

            span {
              font-size: 12px;
              color: var(--gray-300);
            }

            &:hover {
              background-color: var(--gray-750);
            }
          }
        }

        .dropdown-items-container {
          max-height: 250px;
          overflow-y: auto;
          padding: 4px 0;

          .dropdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            margin: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background-color: var(--gray-750);
            }

            &.selected {
              background-color: rgba(101, 98, 245, 0.1);
            }

            .model-info {
              display: flex;
              align-items: center;

              .model-icon {
                width: 24px;
                height: 24px;
                margin-right: 10px;
                border-radius: 6px;
              }

              .model-name {
                font-size: 13px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9);

                .model-custom-name {
                  font-size: 11px;
                  color: rgba(255, 255, 255, 0.6);
                  margin-top: 2px;
                }
              }
            }

            i {
              font-size: 14px;
              color: var(--accent-color);
            }
          }

          .no-results {
            padding: 12px;
            text-align: center;
            font-size: 13px;
            color: var(--gray-500);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDropdownContentComponent {
  @Input() models: FullLLMConfig[] = [];
  @Input() selectedModelId: number | null = null;
  @Output() modelSelected = new EventEmitter<FullLLMConfig>();
  @Output() close = new EventEmitter<void>();

  public searchTerm: string = '';
  public filteredModels: FullLLMConfig[] = [];

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.filterModels();
  }

  public filterModels(): void {
    if (!this.searchTerm.trim()) {
      this.filteredModels = [...this.models];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredModels = this.models.filter(
        (model) =>
          (model.modelDetails?.name?.toLowerCase().includes(searchTermLower) ??
            false) ||
          (model.custom_name?.toLowerCase().includes(searchTermLower) ?? false)
      );
    }
    this.changeDetectorRef.markForCheck();
  }

  public selectModel(model: FullLLMConfig): void {
    this.modelSelected.emit(model);
    this.close.emit();
  }
}

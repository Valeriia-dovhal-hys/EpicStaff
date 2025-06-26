import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  Input,
  SimpleChanges,
  OnChanges,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullLLMConfig } from '../../../../../../features/settings-dialog/services/llms/full-llm-config.service';
import { getProviderIconPath } from '../../../../../../features/settings-dialog/constants/provider-icons.constants';
import { AppIconComponent } from '../../../../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-model-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="model-dropdown-container">
      <div
        class="selected-model-display"
        [class.expanded]="isDropdownOpen()"
        (click)="toggleDropdown()"
      >
        <div class="model-info">
          <app-icon
            [icon]="getProviderIcon(selectedModel())"
            [size]="'2rem'"
            class="provider-icon"
          ></app-icon>
          <div class="model-name">
            {{
              selectedModel()
                ? selectedModel().modelDetails?.name || 'Unknown model'
                : 'Select model'
            }}
            <div class="model-custom-name" *ngIf="selectedModel()?.custom_name">
              {{ selectedModel()?.custom_name }}
            </div>
          </div>
        </div>
        <i
          class="ti"
          [class.ti-chevron-up]="isDropdownOpen()"
          [class.ti-chevron-down]="!isDropdownOpen()"
        ></i>
      </div>

      <div class="dropdown-menu" *ngIf="isDropdownOpen()">
        <div class="dropdown-header">
          <div class="search-container">
            <input
              type="text"
              placeholder="Search models..."
              [ngModel]="searchTerm()"
              (ngModelChange)="setSearchTerm($event)"
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
            *ngFor="let model of filteredModels()"
            class="dropdown-item"
            [class.selected]="model.id === selectedModelId()"
            (click)="selectModel(model); $event.stopPropagation()"
          >
            <div class="model-info">
              <app-icon
                [icon]="getProviderIcon(model)"
                [size]="'2rem'"
                class="provider-icon"
              ></app-icon>
              <div class="model-name">
                {{ model.modelDetails?.name || 'Unknown model' }}
                <div class="model-custom-name" *ngIf="model.custom_name">
                  {{ model.custom_name }}
                </div>
              </div>
            </div>
            <i class="ti ti-check" *ngIf="model.id === selectedModelId()"></i>
          </div>
          <div class="no-results" *ngIf="filteredModels().length === 0">
            No models found
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .model-dropdown-container {
        position: relative;
        width: 100%;

        .selected-model-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: var(--gray-800);
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease;

          &:hover {
            background-color: var(--gray-750);
          }

          &.expanded {
            border-color: var(--accent-color);
            background-color: var(--gray-750);
          }

          .model-info {
            display: flex;
            align-items: center;

            .model-icon {
              width: 24px;
              height: 24px;
              margin-right: 10px;
              border-radius: 4px;
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
            color: rgba(255, 255, 255, 0.7);
          }
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          z-index: 10;
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
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDropdownComponent implements OnChanges {
  @Input() public models: FullLLMConfig[] = [];
  @Input() public selectedModelId: number | null = null;

  @Output() modelSelected = new EventEmitter<number>();

  public readonly searchTerm = signal('');
  public readonly isDropdownOpen = signal(false);

  public readonly modelsSignal = signal<FullLLMConfig[]>([]);
  public readonly selectedModelIdSignal = signal<number | null>(null);

  public readonly filteredModels = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.modelsSignal();
    return this.modelsSignal().filter(
      (model) =>
        (model.modelDetails?.name?.toLowerCase().includes(term) ?? false) ||
        (model.custom_name?.toLowerCase().includes(term) ?? false)
    );
  });

  public readonly selectedModel = computed(() =>
    this.modelsSignal().find(
      (model) => model.id === this.selectedModelIdSignal()
    )
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['models']) {
      this.modelsSignal.set(this.models || []);
    }
    if (changes['selectedModelId']) {
      this.selectedModelIdSignal.set(this.selectedModelId ?? null);
    }
  }

  public toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }

  public setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  public selectModel(model: FullLLMConfig): void {
    this.selectedModelIdSignal.set(model.id);
    this.selectedModelId = model.id;
    this.isDropdownOpen.set(false);
    this.modelSelected.emit(model.id);
  }

  private getProviderIcon(model: FullLLMConfig | undefined | null): string {
    if (!model) return getProviderIconPath(undefined);
    return getProviderIconPath(model.providerDetails?.name);
  }
}

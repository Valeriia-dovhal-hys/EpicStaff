import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ToggleFieldOption {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface NumberFieldOption {
  id: string;
  name: string;
  description: string;
  value: number;
}

interface HierarchicalSetting {
  id: string;
  name: string;
  description: string;
  type: 'number' | 'toggle';
  value?: number;
  selected?: boolean;
}

@Component({
  selector: 'app-field-project-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="field-project-content">
      <div class="field-categories">
        <!-- Advanced Settings -->
        <div class="category">
          <div class="category-header">
            <span>Advanced Settings</span>
          </div>
          <div class="field-list">
            <div
              *ngFor="let field of advancedSettings"
              class="field-item"
              [class.selected]="field.selected"
            >
              <div class="field-details">
                <div class="field-name">{{ field.name }}</div>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-status">
                <label class="toggle">
                  <input
                    type="checkbox"
                    [checked]="field.selected"
                    (change)="toggleAdvancedSetting(field)"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Hierarchical Settings -->
        <div class="category">
          <div class="category-header">
            <span>Hierarchical Settings</span>
          </div>
          <div class="field-list">
            <div
              *ngFor="let field of hierarchicalSettings"
              class="field-item"
              [class.selected]="field.type === 'toggle' && field.selected"
            >
              <div class="field-details">
                <div class="field-name">{{ field.name }}</div>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div
                *ngIf="field.type === 'number'"
                class="field-status execution-input"
              >
                <input
                  type="number"
                  [(ngModel)]="field.value"
                  (change)="updateHierarchicalSetting(field)"
                  [min]="0"
                  class="number-input"
                />
              </div>
              <div *ngIf="field.type === 'toggle'" class="field-status">
                <label class="toggle">
                  <input
                    type="checkbox"
                    [checked]="field.selected"
                    (change)="toggleHierarchicalSetting(field)"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .field-project-content {
        .field-categories {
          .category {
            margin-bottom: 20px;

            &:last-child {
              margin-bottom: 0;
            }

            .category-header {
              margin-bottom: 8px;

              span {
                font-size: 13px;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9);
                display: block;
              }
            }

            .field-list {
              display: flex;
              flex-direction: column;
              gap: 8px;

              .field-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background-color: var(--gray-800);
                border-radius: 4px;
                border: 1px solid transparent;

                &.required {
                  background-color: rgba(235, 87, 87, 0.1);
                  border-color: rgba(235, 87, 87, 0.3);
                }

                &.selected {
                  background-color: rgba(101, 98, 245, 0.1);
                  border-color: var(--accent-color);
                }

                .field-details {
                  .field-name {
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: rgba(255, 255, 255, 0.9);
                  }

                  .field-description {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                  }
                }

                .field-status {
                  .required-badge {
                    font-size: 11px;
                    padding: 2px 6px;
                    background-color: rgba(235, 87, 87, 0.2);
                    color: rgb(235, 87, 87);
                    border-radius: 3px;
                    font-weight: 500;
                  }

                  &.execution-input {
                    display: flex;
                    align-items: center;
                    gap: 8px;

                    .number-input {
                      width: 80px;
                      height: 28px;
                      background-color: var(--gray-700);
                      border: 1px solid var(--gray-600);
                      border-radius: 4px;
                      color: white;
                      padding: 0 8px;
                      font-size: 12px;
                      text-align: center;
                    }
                  }

                  .toggle {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 20px;

                    input {
                      opacity: 0;
                      width: 0;
                      height: 0;

                      &:checked + .slider {
                        background-color: var(--accent-color);
                      }

                      &:checked + .slider:before {
                        transform: translateX(20px);
                      }
                    }

                    .slider {
                      position: absolute;
                      cursor: pointer;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      background-color: var(--gray-600);
                      transition: 0.3s;
                      border-radius: 34px;

                      &:before {
                        position: absolute;
                        content: '';
                        height: 16px;
                        width: 16px;
                        left: 2px;
                        bottom: 2px;
                        background-color: white;
                        transition: 0.3s;
                        border-radius: 50%;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldProjectSectionComponent implements OnInit {
  public advancedSettings: ToggleFieldOption[] = [];
  public hierarchicalSettings: HierarchicalSetting[] = [];

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    // Initialize settings based on the GetProjectRequest interface
    this.loadFieldOptions();
  }

  public toggleAdvancedSetting(field: ToggleFieldOption): void {
    field.selected = !field.selected;
    this.changeDetectorRef.markForCheck();
    // Here you would typically call a service to save this selection
  }

  public updateHierarchicalSetting(field: HierarchicalSetting): void {
    // Handle updating the hierarchical setting
    this.changeDetectorRef.markForCheck();
  }

  public toggleHierarchicalSetting(field: HierarchicalSetting): void {
    if (field.type === 'toggle' && field.selected !== undefined) {
      field.selected = !field.selected;
      this.changeDetectorRef.markForCheck();
    }
  }

  private loadFieldOptions(): void {
    // Advanced Settings (boolean toggles)
    this.advancedSettings = [
      {
        id: 'memory',
        name: 'Memory',
        description: 'Enable project memory capabilities',
        selected: false,
      },
      {
        id: 'cache',
        name: 'Cache',
        description: 'Enable caching of project responses',
        selected: false,
      },
      {
        id: 'full_output',
        name: 'Full Output',
        description: 'Return complete processing results',
        selected: true,
      },
    ];

    // Hierarchical Settings (number inputs and planning toggle)
    this.hierarchicalSettings = [
      {
        id: 'max_rpm',
        name: 'Max RPM',
        description: 'Maximum requests per minute',
        type: 'number',
        value: 5,
      },
      {
        id: 'planning',
        name: 'Planning',
        description: 'Enable hierarchical planning capabilities',
        type: 'toggle',
        selected: false,
      },
    ];
  }
}

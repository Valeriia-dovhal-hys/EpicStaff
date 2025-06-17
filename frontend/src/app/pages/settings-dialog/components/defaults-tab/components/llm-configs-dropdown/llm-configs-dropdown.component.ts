import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullLLMConfig } from '../../../../../../services/full-llm-config.service';
import { ClickOutsideDirective } from '../../../../../../shared/directives/click-outside.directive';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { ModelDropdownContentComponent } from './llm-configs-content.component';

@Component({
  selector: 'app-model-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  template: `
    <div class="model-dropdown-container">
      <div
        class="selected-model-display"
        [class.expanded]="isDropdownOpen"
        (click)="toggleDropdown()"
        #trigger
      >
        <div class="model-info">
          <img
            class="model-icon"
            src="assets/icons/openai-logo.svg"
            alt="Model icon"
          />
          <div class="model-name">
            {{
              selectedModel
                ? selectedModel.modelDetails?.name || 'Unknown model'
                : 'Select model'
            }}
            <div class="model-custom-name" *ngIf="selectedModel?.custom_name">
              {{ selectedModel?.custom_name }}
            </div>
          </div>
        </div>
        <i
          class="ti"
          [class.ti-chevron-up]="isDropdownOpen"
          [class.ti-chevron-down]="!isDropdownOpen"
        ></i>
      </div>

      <!-- Overlay template moved to separate component -->
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
export class ModelDropdownComponent implements OnDestroy {
  @Input() models: FullLLMConfig[] = [];
  @Input() selectedModelId: number | null = null;
  @Output() modelSelected = new EventEmitter<number>();
  @ViewChild('trigger') triggerElement!: ElementRef;

  public isDropdownOpen: boolean = false;
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  public get selectedModel(): FullLLMConfig | undefined {
    return this.models.find((model) => model.id === this.selectedModelId);
  }

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private overlay: Overlay
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeDropdown();
  }

  public toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    this.isDropdownOpen = true;
    this.changeDetectorRef.markForCheck();

    // Get the width of the trigger element
    const triggerWidth =
      this.triggerElement.nativeElement.getBoundingClientRect().width;

    // Create the overlay with fallback position
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerElement)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: 5,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -5,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'model-dropdown-panel',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: Math.max(triggerWidth, 300), // Ensure minimum width
    });

    // Attach the dropdown content component to the overlay
    const dropdownPortal = new ComponentPortal(ModelDropdownContentComponent);
    const componentRef = this.overlayRef.attach(dropdownPortal);

    // Configure the component
    componentRef.instance.models = this.models;
    componentRef.instance.selectedModelId = this.selectedModelId;

    // Handle model selection
    componentRef.instance.modelSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe((model: FullLLMConfig) => {
        this.modelSelected.emit(model.id);
        this.closeDropdown();
      });

    // Handle close event
    componentRef.instance.close.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.closeDropdown();
    });

    // Close the dropdown when the backdrop is clicked
    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeDropdown();
      });
  }

  public closeDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }

    this.isDropdownOpen = false;
    this.changeDetectorRef.markForCheck();
  }
}

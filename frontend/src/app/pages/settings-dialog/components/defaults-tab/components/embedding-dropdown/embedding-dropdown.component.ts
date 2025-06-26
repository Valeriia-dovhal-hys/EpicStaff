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
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { FullEmbeddingConfig } from '../../../../../../features/settings-dialog/services/embeddings/full-embedding.service';
import { EmbeddingDropdownContentComponent } from './embedding-dropdown-content.component';

@Component({
  selector: 'app-embedding-dropdown',
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
                : 'Select embedding model'
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
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddingDropdownComponent implements OnDestroy {
  @Input() models: FullEmbeddingConfig[] = [];
  @Input() selectedModelId: number | null = null;
  @Output() modelSelected = new EventEmitter<number>();
  @ViewChild('trigger') triggerElement!: ElementRef;

  public isDropdownOpen: boolean = false;
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  public get selectedModel(): FullEmbeddingConfig | undefined {
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
    const dropdownPortal = new ComponentPortal(
      EmbeddingDropdownContentComponent
    );
    const componentRef = this.overlayRef.attach(dropdownPortal);

    // Configure the component
    componentRef.instance.models = this.models;
    componentRef.instance.selectedModelId = this.selectedModelId;

    // Handle model selection
    componentRef.instance.modelSelected
      .pipe(takeUntil(this.destroy$))
      .subscribe((model: FullEmbeddingConfig) => {
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

import {
  Component,
  Input,
  ElementRef,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmbeddingConfigsService } from '../../../../../services/embedding_configs.service';
import { ConfirmationDialogService } from '../../../../../shared/components/cofirm-dialog/confimation-dialog.service';
import { SourceCollection } from '../../../models/source-collection.model';
import { KnowledgeSourcesPageService } from '../../../services/knowledge-sources-page.service';
import { CollectionsService } from '../../../services/source-collections.service';
import { RenameCollectionDialogComponent } from '../rename-collection-dialog/rename-collection-dialog.component';

@Component({
  selector: 'app-collection-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="collection-item"
      [class.active]="isActive"
      (click)="onCollectionClick()"
    >
      <div class="collection-name">{{ collection.collection_name }}</div>

      <div class="dropdown">
        <button class="more-options-button" (click)="toggleDropdown($event)">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="18" r="2" fill="currentColor" />
          </svg>
        </button>

        <div class="dropdown-menu" [class.show]="isDropdownOpen">
          <div class="dropdown-item" (click)="onRenameClick($event)">
            Rename
          </div>
          <div class="dropdown-item" (click)="onDeleteClick($event)">
            Delete
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .collection-item {
        display: flex;
        align-items: center;
        padding: 10px 16px;
        border-radius: 10px;
        margin-bottom: 8px;
        background-color: rgba(30, 30, 30, 0.6);
        cursor: pointer;
        transition: background-color 0.2s ease;
        position: relative;

        &:hover {
          background-color: rgba(40, 40, 40, 0.8);
        }

        &.active {
          background-color: rgba(104, 95, 255, 0.15);
        }

        .collection-name {
          flex: 1;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .collection-count {
          margin-left: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
        }

        .collection-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 12px;

          &.status-blue {
            background-color: #3b82f6;
          }

          &.status-red {
            background-color: #ef4444;
          }
        }

        /* Dropdown container */
        .dropdown {
          position: relative;
          display: inline-block;

          .more-options-button {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            margin-left: 8px;
            padding: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;

            &:hover {
              background-color: rgba(255, 255, 255, 0.1);
              color: rgba(255, 255, 255, 0.8);
            }
          }

          /* Hidden by default */
          .dropdown-menu {
            display: none;
            position: absolute;
            right: 0;
            top: 100%;
            margin-top: 5px;
            background-color: #2a2a2a;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            z-index: 10;
            overflow: hidden;
            min-width: 120px;

            /* Show the dropdown menu when the show class is added */
            &.show {
              display: block;
            }

            .dropdown-item {
              padding: 8px 12px;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
              cursor: pointer;
              transition: background-color 0.2s ease;

              &:hover {
                background-color: rgba(255, 255, 255, 0.1);
              }
            }
          }
        }
      }
    `,
  ],
})
export class CollectionItemComponent implements OnDestroy {
  @Input() collection!: SourceCollection;
  @Input() isActive: boolean = false;

  private _destroy$ = new Subject<void>();
  isDropdownOpen = false;

  constructor(
    private elementRef: ElementRef,
    private _dialog: Dialog,
    private _pageService: KnowledgeSourcesPageService,
    private _sourceCollectionsService: CollectionsService,
    private _embeddingConfigsService: EmbeddingConfigsService,
    private _confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  onCollectionClick(): void {
    this.selectCollection(this.collection);
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation(); // Prevent collection selection
    this.isDropdownOpen = !this.isDropdownOpen;
    console.log('Dropdown toggled:', this.isDropdownOpen);
  }

  onRenameClick(event: MouseEvent): void {
    event.stopPropagation(); // Prevent collection selection
    console.log('Rename collection:', this.collection.collection_name);
    this.renameCollection(this.collection);
    this.isDropdownOpen = false;
  }

  /**
   * Handle delete click - confirm and delete collection
   */
  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation(); // Prevent collection selection
    console.log('Delete collection:', this.collection.collection_name);
    this.deleteCollection(this.collection);
    this.isDropdownOpen = false;
  }

  /**
   * Get status class for the collection
   */
  getStatusClass(): string {
    // Here you can implement logic to determine color based on collection status
    // For now I'm alternating between blue and red based on ID as an example
    return this.collection.collection_id % 2 === 0
      ? 'status-blue'
      : 'status-red';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Check if the click was outside of this component
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isDropdownOpen) {
        this.isDropdownOpen = false;
        console.log('Dropdown closed (outside click)');
      }
    }
  }

  private selectCollection(collection: SourceCollection): void {
    this._pageService.setSelectedCollection(collection);
    // this._pageService.setSelectedEmbeddingConfig(null);

    // Fetch the embedding model for this collection
    if (collection.embedder) {
      this._embeddingConfigsService
        .getEmbeddingConfigById(collection.embedder)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: (embeddingConfig) => {
            this._pageService.setSelectedEmbeddingConfig(embeddingConfig);
          },
          error: (error) => {
            console.error('Failed to load embedding model', error);
          },
        });
    }
  }

  private renameCollection(collection: SourceCollection): void {
    const dialogRef = this._dialog.open<string>(
      RenameCollectionDialogComponent,
      {
        width: '450px',
        data: {
          collectionName: collection.collection_name,
          collectionId: collection.collection_id,
        },
        backdropClass: 'dark-blur-backdrop',
      }
    );

    dialogRef.closed.pipe(takeUntil(this._destroy$)).subscribe((newName) => {
      if (newName) {
        this._sourceCollectionsService
          .patchSourceCollection(collection.collection_id, newName)
          .pipe(takeUntil(this._destroy$))
          .subscribe({
            next: () => {
              // Update the collection name in our service
              this._pageService.updateCollection(collection.collection_id, {
                collection_name: newName,
              });
            },
            error: (error) => {
              console.error('Failed to rename collection', error);
              alert(`Failed to rename collection: ${error.message}`);
            },
          });
      }
    });
  }

  private deleteCollection(collection: SourceCollection): void {
    this._confirmationDialogService
      .confirmDelete(collection.collection_name)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (confirmed) => {
          if (confirmed) {
            this._sourceCollectionsService
              .deleteSourceCollection(collection.collection_id)
              .pipe(takeUntil(this._destroy$))
              .subscribe({
                next: () => {
                  // Remove the collection from service
                  this._pageService.removeCollection(collection.collection_id);

                  // If the deleted collection was selected, select another one if available
                  if (
                    this._pageService.selectedCollection()?.collection_id ===
                    collection.collection_id
                  ) {
                    const remainingCollections =
                      this._pageService.collections();
                    if (remainingCollections.length > 0) {
                      this.selectCollection(remainingCollections[0]);
                    } else {
                      this._pageService.setSelectedCollection(null);
                    }
                  }
                },
                error: (error) => {
                  console.error('Failed to delete collection', error);
                  alert(`Failed to delete collection: ${error.message}`);
                },
              });
          }
        },
      });
  }
}

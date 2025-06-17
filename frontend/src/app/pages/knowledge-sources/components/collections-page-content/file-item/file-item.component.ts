import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Source } from '../../../models/source.model';
import { SourcesService } from '../../../services/collections-files.service';
import { KnowledgeSourcesPageService } from '../../../services/knowledge-sources-page.service';
import { ConfirmationDialogService } from '../../../../../shared/components/cofirm-dialog/confimation-dialog.service';

@Component({
  selector: 'app-file-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-item">
      <div class="file-type-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <line
            x1="8"
            y1="7"
            x2="16"
            y2="7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <line
            x1="8"
            y1="12"
            x2="16"
            y2="12"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <line
            x1="8"
            y1="17"
            x2="12"
            y2="17"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <span class="file-extension">{{
          getFileExtension(source.file_name)
        }}</span>
      </div>
      <div class="file-details">
        <div class="file-name">{{ source.file_name }}</div>
      </div>
      <div class="chunk-settings">
        <div class="chunk-strategy">
          <span class="label">Chunk strategy</span>
          <div class="dropdown">
            <span>{{ source.chunk_strategy }}</span>
          </div>
        </div>
        <div class="chunk-size">
          <span class="label">Chunk size</span>
          <div class="dropdown">
            <span>{{ source.chunk_size }}</span>
          </div>
        </div>
        <div class="chunk-overlap">
          <span class="label">Chunk overlap</span>
          <div class="dropdown">
            <span>{{ source.chunk_overlap }}</span>
          </div>
        </div>
      </div>
      <div class="file-actions">
        <button
          class="action-button close-button"
          (click)="onDeleteClick($event)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .file-item {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        border-radius: 12px;
        background-color: rgba(25, 25, 25, 0.4);
        margin-bottom: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }

      .file-item:hover {
        background-color: rgba(40, 40, 40, 0.6);
        border-color: rgba(255, 255, 255, 0.15);
      }

      .file-type-icon {
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background-color: rgba(30, 30, 30, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24px;
        color: rgba(255, 255, 255, 0.7);
      }

      .file-extension {
        position: absolute;
        bottom: -5px;
        right: -5px;
        background-color: #333;
        color: white;
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 4px;
        text-transform: lowercase;
      }

      .file-details {
        flex: 1;
        min-width: 0; /* Allow text truncation */
        margin-right: 32px;
      }

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chunk-settings {
        display: flex;
        gap: 60px;
        margin-right: 24px;
      }

      .chunk-strategy,
      .chunk-size,
      .chunk-overlap {
        display: flex;
        flex-direction: column;
      }

      .label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 4px;
      }

      .dropdown {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 6px;

        span {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 auto;
        }

        svg {
          color: rgba(255, 255, 255, 0.5);
        }
      }

      .file-actions {
        display: flex;
        align-items: center;
      }

      .action-button {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
      }

      .action-button svg {
        stroke: currentColor;
      }
    `,
  ],
})
export class FileItemComponent implements OnDestroy {
  @Input() source!: Source;

  private _destroy$ = new Subject<void>();

  constructor(
    private _sourcesService: SourcesService,
    private _pageService: KnowledgeSourcesPageService,
    private _confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteSource(this.source);
  }

  getFileExtension(fileName: string): string {
    if (!fileName) return 'file';
    const parts = fileName.split('.');
    if (parts.length === 1) return 'file';
    const ext = parts[parts.length - 1].toLowerCase();
    return ext.length > 4 ? ext.substring(0, 4) : ext;
  }

  private deleteSource(source: Source): void {
    this._confirmationDialogService
      .confirmDelete(source.file_name)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (confirmed) => {
          if (confirmed) {
            this._sourcesService
              .deleteSource(source.document_id)
              .pipe(takeUntil(this._destroy$))
              .subscribe({
                next: () => {
                  // Remove the source from service
                  this._pageService.removeSource(source.document_id);
                },
                error: (error) => {
                  console.error('Failed to delete source', error);
                  alert(`Failed to delete source: ${error.message}`);
                },
              });
          }
        },
      });
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FileItemComponent } from './file-item/file-item.component';
import { CollectionHeaderComponent } from './collection-content-header.component.ts/collection-content-header.component';
import { KnowledgeSourcesPageService } from '../../services/knowledge-sources-page.service';
import { SourcesService } from '../../services/collections-files.service';
import { FileUploadDialogComponent } from './add-files-dialog/file-upload-dialog.component';

@Component({
  selector: 'app-collections-page-content',
  standalone: true,
  imports: [CommonModule, FileItemComponent, CollectionHeaderComponent],
  templateUrl: './collections-page-content.component.html',
  styleUrls: ['./collections-page-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsPageContentComponent implements OnInit, OnDestroy {
  private _destroy$ = new Subject<void>();

  constructor(
    private _dialog: Dialog,
    private _pageService: KnowledgeSourcesPageService,
    private _sourcesService: SourcesService,
    private _cdr: ChangeDetectorRef
  ) {}

  public get selectedCollection() {
    return this._pageService.selectedCollection();
  }

  public get filteredSources() {
    return this._pageService.filteredSources();
  }

  public get hasFiles() {
    // Check if there are any files at all, regardless of search filtering
    return this._pageService
      .allSources()
      .some(
        (source) =>
          source.source_collection === this.selectedCollection?.collection_id
      );
  }

  public get searchQuery() {
    return this._pageService.searchQuery();
  }

  public ngOnInit(): void {}

  /**
   * Handle upload files button click
   */
  public onUploadFiles(): void {
    const selectedCollection = this.selectedCollection;
    if (!selectedCollection) {
      return;
    }

    const dialogRef = this._dialog.open(FileUploadDialogComponent, {
      minWidth: '550px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { collectionId: selectedCollection.collection_id },
    });

    dialogRef.closed.pipe(takeUntil(this._destroy$)).subscribe((result) => {
      if (result) {
        // Refresh sources
        this.fetchSources();
      }
    });
  }

  /**
   * Fetch sources data
   */
  private fetchSources(): void {
    this._sourcesService
      .getSources()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (sources) => {
          this._pageService.setAllSources(sources);
          this._cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching sources:', error);
          this._cdr.markForCheck();
        },
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}

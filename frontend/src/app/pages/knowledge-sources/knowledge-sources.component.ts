import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { forkJoin, of, Subject } from 'rxjs';
import {
  catchError,
  finalize,
  takeUntil,
  switchMap,
  map,
} from 'rxjs/operators';

import { PageHeaderComponent } from '../../shared/components/header/page-header.component';
import { CollectionsSidebarComponent } from './components/collections-page-sidebar/collections-page-sidebar.component';
import { CollectionsPageContentComponent } from './components/collections-page-content/collections-page-content.component';
import { KnowledgeSourcesPageService } from './services/knowledge-sources-page.service';
import { CollectionsService } from './services/source-collections.service';
import { SourcesService } from './services/collections-files.service';
import { CreateCollectionDialogComponent } from './components/create-collection-dialog/create-collection-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { NgIf } from '@angular/common';
import { EmbeddingConfigsService } from '../../services/embedding_configs.service';

@Component({
  selector: 'app-knowledge-sources',
  templateUrl: './knowledge-sources.component.html',
  styleUrls: ['./knowledge-sources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CollectionsSidebarComponent,
    CollectionsPageContentComponent,
    SpinnerComponent,
    NgIf,
  ],
  standalone: true,
})
export class KnowledgeSourcesComponent implements OnInit, OnDestroy {
  // Loading state signal
  public isLoading = signal<boolean>(true);

  // Subscription management
  private _destroy$ = new Subject<void>();

  constructor(
    private _pageService: KnowledgeSourcesPageService,
    private _collectionsService: CollectionsService,
    private _sourcesService: SourcesService,
    private _embeddingConfigsService: EmbeddingConfigsService,
    private _cdr: ChangeDetectorRef,
    private _dialog: Dialog
  ) {}

  public ngOnInit(): void {
    this.fetchInitialData();
  }

  public openCreateCollectionDialog(): void {
    const dialogRef = this._dialog.open(CreateCollectionDialogComponent, {
      minWidth: '550px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {},
      backdropClass: 'dark-blur-backdrop',
    });

    dialogRef.closed.pipe(takeUntil(this._destroy$)).subscribe((result) => {
      if (result) {
        this.fetchInitialData();
      }
    });
  }

  public ngOnDestroy(): void {
    // Cleanup subscriptions
    this._destroy$.next();
    this._destroy$.complete();
  }

  private fetchInitialData(): void {
    // Set loading state
    this.isLoading.set(true);
    this._pageService.setLoaded(false);

    const loadStartTime = Date.now();

    // Use forkJoin to fetch collections and sources in parallel
    forkJoin({
      collections: this._collectionsService.getSourceCollections().pipe(
        catchError((error) => {
          console.error('Failed to load collections:', error);
          return of([]);
        })
      ),
      sources: this._sourcesService.getSources().pipe(
        catchError((error) => {
          console.error('Failed to load sources:', error);
          return of([]);
        })
      ),
    })
      .pipe(
        takeUntil(this._destroy$),
        switchMap(({ collections, sources }) => {
          // Sort collections by ID in descending order (highest first)
          const sortedCollections = [...collections].sort(
            (a, b) => b.collection_id - a.collection_id
          );

          // Set collections in the service
          this._pageService.setCollections(sortedCollections);

          // Set sources in the service
          this._pageService.setAllSources(sources);

          // Select the first collection if available, otherwise null
          let selectedCollection = null;
          if (sortedCollections.length > 0) {
            selectedCollection = sortedCollections[0];
            this._pageService.setSelectedCollection(selectedCollection);
          } else {
            this._pageService.setSelectedCollection(null);
          }

          // If there's a selected collection with an embedder, fetch the embedding config
          if (selectedCollection && selectedCollection.embedder) {
            return this._embeddingConfigsService
              .getEmbeddingConfigById(selectedCollection.embedder)
              .pipe(
                catchError((error) => {
                  console.error('Failed to load embedding config:', error);
                  return of(null);
                }),
                map((embeddingConfig) => ({
                  collections: sortedCollections,
                  sources,
                  embeddingConfig,
                }))
              );
          }

          // Otherwise, return the initial data with no embedding config
          return of({
            collections: sortedCollections,
            sources,
            embeddingConfig: null,
          });
        }),
        finalize(() => {
          // Ensure minimum loading time of 500ms
          const loadTime = Date.now() - loadStartTime;
          const remainingTime = Math.max(0, 500 - loadTime);

          setTimeout(() => {
            this.isLoading.set(false);
            this._cdr.markForCheck();
          }, remainingTime);
        })
      )
      .subscribe({
        next: ({ collections, sources, embeddingConfig }) => {
          // Set embedding config if we received one
          if (embeddingConfig) {
            this._pageService.setSelectedEmbeddingConfig(embeddingConfig);
          }

          // Set loaded state to true
          this._pageService.setLoaded(true);

          // Trigger change detection
          this._cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching initial data:', error);
          // Even on error, mark as loaded to exit loading state
          this._pageService.setLoaded(true);
          this._cdr.markForCheck();
        },
      });
  }
}

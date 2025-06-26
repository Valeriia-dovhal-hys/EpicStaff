import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { forkJoin, of, Subject, timer, Subscription } from 'rxjs';
import {
  catchError,
  finalize,
  takeUntil,
  switchMap,
  map,
  takeWhile,
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
import { EmbeddingConfigsService } from '../../features/settings-dialog/services/embeddings/embedding_configs.service';
import { GetSourceCollectionRequest } from './models/source-collection.model';

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
  private _pollingSubscription?: Subscription;

  constructor(
    private _pageService: KnowledgeSourcesPageService,
    private _collectionsService: CollectionsService,
    private _sourcesService: SourcesService,
    private _embeddingConfigsService: EmbeddingConfigsService,
    private _cdr: ChangeDetectorRef,
    private _dialog: Dialog
  ) {}

  public ngOnInit(): void {
    this.fetchInitialData(false);
  }

  public openCreateCollectionDialog(): void {
    const dialogRef = this._dialog.open(CreateCollectionDialogComponent, {
      minWidth: '550px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        collections: this._pageService.collections(),
      },
    });

    dialogRef.closed.pipe(takeUntil(this._destroy$)).subscribe((result) => {
      if (result) {
        // After creating a new collection, fetch data and select the most recent one
        this.fetchInitialData(true);
      }
    });
  }

  public ngOnDestroy(): void {
    // Cleanup subscriptions
    this._destroy$.next();
    this._destroy$.complete();

    // Ensure polling subscription is stopped
    this.stopPolling();
  }

  private needsPolling(collections: GetSourceCollectionRequest[]): boolean {
    return collections.some((collection) => collection.status !== 'completed');
  }

  private stopPolling(): void {
    if (this._pollingSubscription) {
      this._pollingSubscription.unsubscribe();
      this._pollingSubscription = undefined;
    }
  }

  private startCollectionsPolling(interval: number = 2000): void {
    this.stopPolling();

    this._pollingSubscription = timer(interval, interval)
      .pipe(
        takeUntil(this._destroy$),

        switchMap(() =>
          this._collectionsService.getGetSourceCollectionRequests().pipe(
            catchError((error) => {
              console.error('Failed to poll collections:', error);
              return of([]);
            })
          )
        ),
        // Continue polling until all collections are completed
        takeWhile(
          (collections) => this.needsPolling(collections),
          // Include the last value (when all are completed)
          true
        )
      )
      .subscribe({
        next: (updatedCollections) => {
          // Sort collections to maintain consistent order
          const sortedCollections = [...updatedCollections].sort(
            (a, b) => b.collection_id - a.collection_id
          );

          // Update the collections in the service
          this._pageService.setCollections(sortedCollections);

          // Log polling status for debugging
          console.log(
            'Collections polling - in progress collections:',
            updatedCollections.filter((c) => c.status !== 'completed').length
          );

          // Trigger change detection
          this._cdr.markForCheck();
        },
        complete: () => {
          console.log(
            'Collections polling completed - all collections are now in completed state'
          );
        },
      });
  }

  private selectMostRecentCollection(
    collections: GetSourceCollectionRequest[]
  ): void {
    // If no collections, set selected to null
    if (!collections.length) {
      this._pageService.setSelectedCollection(null);
      return;
    }

    // Sort by ID in descending order and take the first (highest ID = most recent)
    const mostRecentCollection: GetSourceCollectionRequest = [
      ...collections,
    ].sort((a, b) => b.collection_id - a.collection_id)[0];

    // Set as selected collection
    this._pageService.setSelectedCollection(mostRecentCollection);

    // If collection has an embedder, fetch the embedding config
    if (mostRecentCollection && mostRecentCollection.embedder) {
      this._embeddingConfigsService
        .getEmbeddingConfigById(mostRecentCollection.embedder)
        .pipe(
          takeUntil(this._destroy$),
          catchError((error) => {
            console.error('Failed to load embedding config:', error);
            return of(null);
          })
        )
        .subscribe((embeddingConfig) => {
          if (embeddingConfig) {
            this._pageService.setSelectedEmbeddingConfig(embeddingConfig);
          }
          this._cdr.markForCheck();
        });
    }
  }

  private endLoadingWithDelay(
    startTime: number,
    minDuration: number = 500
  ): void {
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minDuration - elapsedTime);

    setTimeout(() => {
      this.isLoading.set(false);
      this._cdr.markForCheck();
    }, remainingTime);
  }

  private fetchInitialData(selectMostRecent: boolean = false): void {
    // Set loading state
    this.isLoading.set(true);
    this._pageService.setLoaded(false);

    const loadStartTime = Date.now();

    // Use forkJoin to fetch collections and sources in parallel
    forkJoin({
      collections: this._collectionsService
        .getGetSourceCollectionRequests()
        .pipe(
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
        finalize(() => {
          // Ensure minimum loading time to prevent UI flickering
          this.endLoadingWithDelay(loadStartTime);
        })
      )
      .subscribe({
        next: ({ collections, sources }) => {
          console.log('Fetched collections:', collections);
          console.log('Fetched sources:', sources);

          // Sort collections by ID in descending order (highest first)
          const sortedCollections = [...collections].sort(
            (a, b) => b.collection_id - a.collection_id
          );

          // Set collections in the service
          this._pageService.setCollections(sortedCollections);

          //   Set sources in the service
          this._pageService.setAllSources(sources);

          // Select the appropriate collection based on context
          if (selectMostRecent) {
            // After creating a new collection, select the most recent one
            this.selectMostRecentCollection(sortedCollections);
            console.log('Selected most recent collection after creation');
          } else {
            // On initial load, also select the most recent collection
            // This ensures consistent behavior
            this.selectMostRecentCollection(sortedCollections);
          }

          // Set loaded state to true
          this._pageService.setLoaded(true);

          // Trigger change detection
          this._cdr.markForCheck();

          // Check if we need to start polling for collection status updates
          if (this.needsPolling(sortedCollections)) {
            console.log('Starting collection status polling...');
            this.startCollectionsPolling();
          } else {
            console.log('All collections already completed, no polling needed');
          }
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

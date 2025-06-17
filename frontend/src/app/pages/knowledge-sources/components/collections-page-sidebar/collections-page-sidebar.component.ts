import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CollectionItemComponent } from './collections-item/collection-item.component';
import { KnowledgeSourcesPageService } from '../../services/knowledge-sources-page.service';
import { CreateCollectionDialogComponent } from '../create-collection-dialog/create-collection-dialog.component';
import { Search2Component } from '../../../../shared/components/search2/search2.component';

@Component({
  selector: 'app-collections-sidebar',
  templateUrl: './collections-page-sidebar.component.html',
  styleUrls: ['./collections-page-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    CollectionItemComponent,
    Search2Component,
  ],
})
export class CollectionsSidebarComponent implements OnDestroy {
  @Output() openCreate = new EventEmitter<void>();
  private _destroy$ = new Subject<void>();

  public isLoading = false;
  public searchQuery: string = '';

  constructor(
    private _pageService: KnowledgeSourcesPageService,
    private _cdr: ChangeDetectorRef
  ) {}

  public ngOnDestroy(): void {
    // Cleanup subscriptions
    this._destroy$.next();
    this._destroy$.complete();
  }

  public get collections() {
    return this._pageService.collections();
  }

  public get selectedCollection() {
    return this._pageService.selectedCollection();
  }

  public get filteredCollections() {
    if (!this.searchQuery.trim()) {
      return this.collections;
    }

    return this.collections.filter((collection) => {
      // Add the property you want to search by
      // Assuming collections have a name property, update as needed
      return collection.collection_name
        ?.toLowerCase()
        .includes(this.searchQuery.toLowerCase());
    });
  }

  public openCreateCollectionDialog(): void {
    this.openCreate.emit();
  }

  public onCreateCollection(): void {
    this.openCreateCollectionDialog();
  }
}

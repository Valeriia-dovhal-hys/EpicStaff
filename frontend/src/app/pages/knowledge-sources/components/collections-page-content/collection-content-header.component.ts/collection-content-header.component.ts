import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeSourcesPageService } from '../../../services/knowledge-sources-page.service';
import { CollectionStatus } from '../../../models/source-collection.model';
import { Search2Component } from '../../../../../shared/components/search2/search2.component';

@Component({
  selector: 'app-collection-header',
  standalone: true,
  imports: [CommonModule, Search2Component],
  templateUrl: './collection-content-header.component.html',
  styleUrls: ['./collection-content-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionHeaderComponent implements OnInit {
  @Output() uploadFiles = new EventEmitter<void>();

  // Search query binding
  searchQuery: string = '';

  constructor(private _pageService: KnowledgeSourcesPageService) {}

  ngOnInit(): void {
    // Initialize search query from service
    this.searchQuery = this._pageService.searchQuery();
  }

  public get selectedCollection() {
    return this._pageService.selectedCollection();
  }

  public get selectedEmbeddingConfig() {
    return this._pageService.selectedEmbeddingConfig();
  }

  /**
   * Gets the display name for a collection status
   */
  public getStatusLabel(status: string): string {
    switch (status) {
      case CollectionStatus.NEW:
        return 'New';
      case CollectionStatus.PROCESSING:
        return 'Processing';
      case CollectionStatus.COMPLETED:
        return 'Completed';
      case CollectionStatus.FAILED:
        return 'Failed';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets the CSS class for the status indicator
   */
  public getStatusClass(status: string): string {
    switch (status) {
      case CollectionStatus.NEW:
        return 'status-new';
      case CollectionStatus.PROCESSING:
        return 'status-processing';
      case CollectionStatus.COMPLETED:
        return 'status-completed';
      case CollectionStatus.FAILED:
        return 'status-failed';
      default:
        return '';
    }
  }

  /**
   * Emits event to parent component to handle file upload
   */
  public onUploadFiles(): void {
    this.uploadFiles.emit();
  }

  /**
   * Handle search query changes
   */
  public onSearchChange(query: string): void {
    this.searchQuery = query;
    this._pageService.setSearchQuery(query);
  }
}

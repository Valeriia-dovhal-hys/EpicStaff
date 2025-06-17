import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-flows-page-header',
  imports: [MatIconModule],
  templateUrl: './flows-page-header.component.html',
  styleUrls: ['./flows-page-header.component.scss'],
})
export class FlowsPageHeaderComponent {
  @Input() projectCount: number | null = 0;
  @Input() searchTerm: string = '';
  @Input() showFavorites: boolean = false;

  @Output() searchInput = new EventEmitter<string>();
  @Output() toggleFavoriteFilter = new EventEmitter<void>();
  @Output() openCreate = new EventEmitter<void>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.emit(value);
  }

  toggleFavorite(): void {
    this.toggleFavoriteFilter.emit();
  }

  openCreateForm(): void {
    this.openCreate.emit();
  }
}

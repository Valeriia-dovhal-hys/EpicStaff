import {
  Component,
  EventEmitter,
  Output,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SearchComponent } from '../search/search.component';
import { ButtonComponent } from '../buttons/button/button.component';

export interface SearchFilterChange {
  searchTerm: string;
  selectedTagIds?: number[];
}

@Component({
  selector: 'app-filters-list',
  standalone: true,
  templateUrl: './filters-list.component.html',
  styleUrls: ['./filters-list.component.scss'],
  imports: [ButtonComponent, SearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersListComponent {
  @Input() public searchPlaceholder: string = 'Search...';
  @Input() public showTags: boolean = true;

  public searchTerm: string = '';

  @Output() change = new EventEmitter<SearchFilterChange>();

  public onSearchValueChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.emitChange(searchTerm);
  }

  private emitChange(searchTerm: string): void {
    const filterData: SearchFilterChange = {
      searchTerm,
    };
    this.change.emit(filterData);
  }
}

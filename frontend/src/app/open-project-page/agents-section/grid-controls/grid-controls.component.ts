import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchDropdownComponent } from './dropdown-staff-agents/search-dropdown.component';

export type GridSizeOption = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-grid-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchDropdownComponent, NgIf],
  templateUrl: './grid-controls.component.html',
  styleUrls: ['./grid-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridControlsComponent {
  @Input() currentSize: GridSizeOption = 'medium';
  @Output() showDropdownChange = new EventEmitter<boolean>();
  @Output() currentSizeChange = new EventEmitter<GridSizeOption>();

  public showDropdown = false;
  public sizeOptions: GridSizeOption[] = ['small', 'medium', 'large'];
  public searchTerm = ''; // Add this to store the search input value

  constructor(private cdr: ChangeDetectorRef) {}

  public onSearchFocus(): void {
    this.showDropdown = true;
    this.showDropdownChange.emit(this.showDropdown);
    this.cdr.markForCheck();
  }

  public onSizeChange(size: GridSizeOption): void {
    this.currentSize = size;
    this.currentSizeChange.emit(size);
    this.cdr.markForCheck();
  }

  public onCloseDropdown(): void {
    this.showDropdown = false;
    this.searchTerm = ''; // Clear search term when closing dropdown
    this.showDropdownChange.emit(this.showDropdown);
    this.cdr.markForCheck();
  }

  // Add method to handle search input changes
  public onSearchChange(): void {
    // Just mark for check to ensure the view updates
    this.cdr.markForCheck();
  }
}

import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-model-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <i class="ti ti-search search-icon"></i>
      <input
        type="text"
        class="search-input"
        [placeholder]="placeholder"
        [(ngModel)]="searchTerm"
        (input)="onSearchInput()"
      />
    </div>
  `,
  styles: [
    `
      .search-container {
        position: relative;

        width: 280px;

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-500);
          font-size: 14px;
        }

        .search-input {
          width: 100%;
          padding: 6px 12px 6px 32px;
          background-color: var(--gray-800);
          border: 1px solid var(--gray-750);
          border-radius: 4px;
          color: #ededed;
          font-size: 14px;

          &::placeholder {
            color: var(--gray-500);
          }

          &:focus {
            outline: none;
            border-color: var(--accent-color);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelSearchComponent {
  @Input() placeholder = 'Search...';
  @Output() search = new EventEmitter<string>();

  searchTerm = '';

  onSearchInput(): void {
    this.search.emit(this.searchTerm);
  }
}

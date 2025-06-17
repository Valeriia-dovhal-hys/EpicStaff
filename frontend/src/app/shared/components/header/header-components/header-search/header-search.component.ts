import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-search',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="projects-page-search"
      [class.projects-page-search-has-content]="searchTerm.trim().length > 0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <circle cx="10" cy="10" r="7"></circle>
        <line x1="15" y1="15" x2="20" y2="20"></line>
      </svg>

      <input
        type="text"
        class="projects-page-search-input"
        [placeholder]="placeholder"
        [value]="searchTerm"
        (input)="onInputChange($event)"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .projects-page-search {
        display: flex;
        align-items: center;
        padding: 0.4rem 1rem;
        width: 300px;
        height: 36px;
        transition: all 0.2s ease;
        background-color: var(--button-bg);
        border-radius: 6px;
        box-shadow: inset 0 0 0 1px var(--gray-700);

        &.projects-page-search-has-content {
          box-shadow: inset 0 0 0 1px var(--accent-color);
        }

        &:focus-visible {
          outline: 2px solid var(--white);
          outline-offset: 2px;
        }

        &:focus-within {
          color: var(--accent-color);
        }

        svg {
          margin-bottom: 3px;
          width: 30px;
          height: 18px;
          color: var(--gray-400);
        }

        .projects-page-search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: var(--gray-200);
          width: 100%;
          height: 100%;
          margin-left: 0.7rem;

          &::placeholder {
            color: var(--gray-500);
            font-weight: 400;
            font-size: 14px;
          }
        }
      }
    `,
  ],
})
export class ProjectSearchComponent {
  @Input() searchTerm: string = '';
  @Input() placeholder: string = '';
  @Output() searchInput = new EventEmitter<string>();

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.emit(value);
  }
}

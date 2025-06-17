import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-project-sort-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="projects-page-sort-dropdown">
      <button class="projects-page-sort-btn" (click)="onSort()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-sort"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 9l4 -4l4 4m-4 -4v14" />
          <path d="M21 15l-4 4l-4 -4m4 4v-14" />
        </svg>
        Sort
      </button>
    </div>
  `,
  styles: [
    `
      .projects-page-sort-dropdown {
        position: relative;

        .projects-page-sort-btn {
          display: flex;
          align-items: center;
          background-color: var(--button-bg);
          padding: 0.4rem 1rem;
          font-size: 14px;
          font-weight: 400;
          color: var(--gray-300);
          border-radius: 6px;
          cursor: pointer;
          gap: 0.5rem;
          transition: all 0.2s ease;
          height: 36px;
          border: none;
          box-shadow: inset 0 0 0 1px var(--gray-700);

          &:hover {
            color: var(--white);
            background-color: var(--button-hover-bg);
            box-shadow: inset 0 0 0 1px var(--accent-color),
              0 0 0 1px rgba(104, 95, 255, 0.1);

            svg {
              color: var(--accent-color);
            }
          }

          svg {
            color: var(--gray-400);
            transition: color 0.2s ease;
          }
        }
      }
    `,
  ],
})
export class ProjectSortButtonComponent {
  @Output() sortEvent = new EventEmitter<void>();

  onSort(): void {
    this.sortEvent.emit();
  }
}

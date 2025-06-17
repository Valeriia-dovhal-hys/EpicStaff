import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphMessage } from '../../graph-session-message.model';
import { expandCollapseAnimation } from '../../../../../../shared/animations/animations-expand-collapse';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  animations: [expandCollapseAnimation],
  template: `
    <div class="error-flow-container">
      <div class="error-header">
        <div class="icon-container">
          <i class="ti ti-alert-circle"></i>
        </div>
        <h3>Error</h3>
      </div>

      <!-- Main Error Section -->
      <div class="error-section">
        <div class="section-heading" (click)="toggleErrorSection()">
          <i
            class="ti"
            [ngClass]="
              isErrorExpanded ? 'ti-caret-down-filled' : 'ti-caret-right-filled'
            "
          ></i>
          Error Details
        </div>
        <div
          class="collapsible-content"
          [@expandCollapse]="isErrorExpanded ? 'expanded' : 'collapsed'"
        >
          <div
            class="result-content"
            [ngClass]="{ collapsed: isCollapsed && shouldShowToggle() }"
          >
            <pre>{{ getFormattedErrorDetails() }}</pre>
          </div>
          <button
            *ngIf="shouldShowToggle() && isErrorExpanded"
            class="toggle-button"
            (click)="toggleCollapse()"
          >
            {{ isCollapsed ? 'Show more' : 'Show less' }}
          </button>
        </div>
      </div>

      <!-- Optional Data Subsection -->
      <div class="error-data-container" *ngIf="hasErrorData()">
        <div class="section-heading" (click)="toggleDataSection()">
          <i
            class="ti"
            [ngClass]="
              isDataExpanded ? 'ti-caret-down-filled' : 'ti-caret-right-filled'
            "
          ></i>
          Data
        </div>
        <div
          class="collapsible-content"
          [@expandCollapse]="isDataExpanded ? 'expanded' : 'collapsed'"
        >
          <div class="result-content">
            <pre>{{ getFormattedErrorData() }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .error-flow-container {
        background-color: var(--gray-850);
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid #ff6b6b;
      }

      .error-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.25rem;
      }

      .icon-container {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: #ff6b6b;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20px;
        flex-shrink: 0;
      }

      .icon-container i {
        color: var(--gray-900);
        font-size: 1.25rem;
      }

      h3 {
        color: var(--gray-100);
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .error-section,
      .error-data-container {
        padding-left: 3.5rem; /* aligns subsection headings/content */
      }

      .section-heading {
        font-weight: 500;
        color: var(--gray-300);
        margin-bottom: 0.5rem;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
      }

      .section-heading i {
        margin-right: 8px;
        color: #ff6b6b;
        font-size: 1.1rem;
        margin-left: -3px;
        transition: transform 0.3s ease;
      }

      .collapsible-content {
        overflow: hidden;
        position: relative;
      }

      .collapsible-content.ng-animating {
        overflow: hidden;
      }

      .result-content {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        color: var(--gray-200);
        white-space: pre-wrap;
        word-break: break-word;
        overflow-y: auto;
        transition: max-height 0.3s ease;
      }

      .result-content.collapsed {
        max-height: 200px;
      }

      .toggle-button {
        background-color: transparent;
        border: none;
        color: #ff6b6b;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.5rem;
        text-align: center;
        width: 100%;
        margin-top: 0.25rem;
      }

      .toggle-button:hover {
        text-decoration: underline;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        font-family: 'Courier New', monospace;
      }
    `,
  ],
})
export class ErrorMessageComponent {
  @Input() message!: GraphMessage;

  // Expand/collapse controls
  isErrorExpanded = true;
  isCollapsed = true;
  isDataExpanded = false;

  toggleErrorSection(): void {
    this.isErrorExpanded = !this.isErrorExpanded;
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  shouldShowToggle(): boolean {
    const details = this.getFormattedErrorDetails();
    // Show "Show more/Show less" if content is longer than ~5 lines or 500 chars
    return details.split('\n').length > 5 || details.length > 500;
  }

  toggleDataSection(): void {
    this.isDataExpanded = !this.isDataExpanded;
  }

  // ---------- Primary Error Details ----------
  get errorDetails(): any {
    if (
      this.message.message_data &&
      this.message.message_data.message_type === 'error' &&
      'details' in this.message.message_data
    ) {
      return this.message.message_data.details;
    }
    return { error: 'Unknown error' };
  }

  getFormattedErrorDetails(): string {
    const details = this.errorDetails;
    if (typeof details === 'string') {
      // Remove surrounding quotes if present
      if (details.startsWith('"') && details.endsWith('"')) {
        return details.substring(1, details.length - 1);
      }
      return details;
    }
    return JSON.stringify(details, null, 2);
  }

  // ---------- Additional Data Subsection ----------
  get errorData(): any {
    if (
      this.message.message_data &&
      this.message.message_data.message_type === 'error' &&
      'data' in this.message.message_data
    ) {
      return this.message.message_data.data;
    }
    return null;
  }

  hasErrorData(): boolean {
    return this.errorData !== null && this.errorData !== undefined;
  }

  getFormattedErrorData(): string {
    if (typeof this.errorData === 'string') {
      return this.errorData;
    } else if (this.errorData) {
      return JSON.stringify(this.errorData, null, 2);
    }
    return 'No additional data provided.';
  }
}

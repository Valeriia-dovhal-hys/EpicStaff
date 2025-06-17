import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import {
  GraphMessage,
  TaskMessageData,
  MessageType,
} from '../../graph-session-message.model';
import { expandCollapseAnimation } from '../../../../../../shared/animations/animations-expand-collapse';

@Component({
  selector: 'app-task-message',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  animations: [expandCollapseAnimation],
  template: `
    <div class="agent-flow-container">
      <!-- Task Message Header with Toggle -->
      <div class="agent-header" (click)="toggleMessage()">
        <div class="play-arrow">
          <i
            class="ti"
            [ngClass]="
              isMessageExpanded
                ? 'ti-caret-down-filled'
                : 'ti-caret-right-filled'
            "
          ></i>
        </div>
        <div class="icon-container">
          <i class="ti ti-list-check"></i>
        </div>
        <h3>
          Task <span class="task-name">{{ getTaskName() }}</span> is done
        </h3>
      </div>

      <!-- Collapsible Task Content -->
      <div
        class="collapsible-content"
        [@expandCollapse]="isMessageExpanded ? 'expanded' : 'collapsed'"
      >
        <div class="agent-content">
          <!-- Task Details Section -->
          <div class="details-container" *ngIf="hasDetails()">
            <div class="section-heading" (click)="toggleSection('details')">
              <i
                class="ti"
                [ngClass]="
                  isDetailsExpanded
                    ? 'ti-caret-down-filled'
                    : 'ti-caret-right-filled'
                "
              ></i>
              Task Details
            </div>
            <div
              class="collapsible-content"
              [@expandCollapse]="isDetailsExpanded ? 'expanded' : 'collapsed'"
            >
              <div class="details-content">
                <div
                  class="description-section"
                  *ngIf="taskMessageData?.description"
                >
                  <div class="subsection-heading">Description:</div>
                  <div class="description-content">
                    {{ taskMessageData?.description }}
                  </div>
                </div>

                <div
                  class="expected-output-section"
                  *ngIf="taskMessageData?.expected_output"
                >
                  <div class="subsection-heading">Expected Output:</div>
                  <div class="expected-output-content">
                    {{ taskMessageData?.expected_output }}
                  </div>
                </div>

                <div class="agent-section" *ngIf="taskMessageData?.agent">
                  <div class="subsection-heading">Assigned To:</div>
                  <div class="agentData-content">
                    {{ taskMessageData?.agent }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Result Section -->
          <div class="raw-container" *ngIf="hasRawData()">
            <div class="section-heading" (click)="toggleSection('raw')">
              <i
                class="ti"
                [ngClass]="
                  isRawExpanded
                    ? 'ti-caret-down-filled'
                    : 'ti-caret-right-filled'
                "
              ></i>
              Result
            </div>
            <div
              class="collapsible-content"
              [@expandCollapse]="isRawExpanded ? 'expanded' : 'collapsed'"
            >
              <div class="result-wrapper">
                <!-- Markdown Output -->
                <div
                  class="markdown-content"
                  [ngClass]="{ collapsed: isCollapsed && shouldShowToggle() }"
                >
                  <markdown [data]="this.taskMessageData?.raw"></markdown>
                </div>
                <button
                  *ngIf="shouldShowToggle() && isRawExpanded"
                  class="toggle-button"
                  (click)="toggleCollapse()"
                >
                  {{ isCollapsed ? 'Show more' : 'Show less' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .agent-flow-container {
        background-color: var(--gray-850);
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid #30a46c;
      }

      .agent-header {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }

      .play-arrow {
        margin-right: 16px;
        display: flex;
        align-items: center;
      }

      .play-arrow i {
        color: #30a46c;
        font-size: 1.1rem;
        transition: transform 0.3s ease;
      }

      .icon-container {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: #30a46c;
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .task-name {
        color: #30a46c;
        font-weight: 400;
        margin: 0 5px;
      }

      .agent-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-left: 5.5rem;
        margin-top: 1.25rem;
        overflow: hidden;
      }

      /* Collapsible content container */
      .collapsible-content {
        overflow: hidden;
        position: relative;
      }

      .collapsible-content.ng-animating {
        overflow: hidden;
      }

      /* Section styling */
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
        color: #30a46c;
        font-size: 1.1rem;
        margin-left: -3px;
        transition: transform 0.3s ease;
      }

      .details-content {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        color: var(--gray-200);
        margin-left: 23px;
      }

      .subsection-heading {
        font-weight: 500;
        color: #30a46c;
        margin-bottom: 0.5rem;
        margin-top: 1rem;
      }

      .subsection-heading:first-child {
        margin-top: 0;
      }

      .description-content,
      .expected-output-content,
      .agentData-content {
        padding: 0.5rem;
        background-color: var(--gray-850);
        border-radius: 6px;
      }

      .expected-output-section,
      .agent-section {
        margin-top: 1rem;
      }

      .result-wrapper {
        margin-left: 23px;
      }

      .markdown-content {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        color: var(--gray-200);
        overflow-y: auto;
        transition: max-height 0.3s ease;
      }

      .markdown-content.collapsed {
        max-height: 200px;
      }

      .toggle-button {
        background-color: transparent;
        border: none;
        color: #30a46c;
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
      }

      .formatted-json {
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 1rem;
        overflow-x: hidden;
        max-width: 100%;
      }
    `,
  ],
})
export class TaskMessageComponent implements OnInit {
  @Input() message!: GraphMessage;
  isMessageExpanded = false;
  isDetailsExpanded = false;
  isRawExpanded = true;
  isCollapsed = true;

  ngOnInit() {
    // Any initialization logic here
  }

  toggleMessage(): void {
    this.isMessageExpanded = !this.isMessageExpanded;
  }

  toggleSection(section: 'details' | 'raw'): void {
    if (section === 'details') {
      this.isDetailsExpanded = !this.isDetailsExpanded;
    } else if (section === 'raw') {
      this.isRawExpanded = !this.isRawExpanded;
    }
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  shouldShowToggle(): boolean {
    if (!this.taskMessageData?.raw) return false;

    // Using the same logic as in AgentFinishMessageComponent
    // Show toggle button if content is longer than approximately 5 lines
    return (
      this.taskMessageData.raw.split('\n').length > 5 ||
      this.taskMessageData.raw.length > 500
    );
  }

  getTaskName(): string {
    return this.taskMessageData?.name || 'Task';
  }

  hasDetails(): boolean {
    return !!(
      this.taskMessageData?.description ||
      this.taskMessageData?.expected_output ||
      this.taskMessageData?.agent
    );
  }

  hasRawData(): boolean {
    return !!this.taskMessageData?.raw && this.taskMessageData.raw !== '';
  }

  get taskMessageData(): TaskMessageData | null {
    if (
      this.message.message_data &&
      this.message.message_data.message_type === 'task'
    ) {
      return this.message.message_data as TaskMessageData;
    }
    return null;
  }
}

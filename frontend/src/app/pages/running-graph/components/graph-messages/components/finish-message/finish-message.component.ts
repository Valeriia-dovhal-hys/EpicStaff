import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MarkdownModule } from 'ngx-markdown';
import {
  GraphMessage,
  FinishMessageData,
} from '../../graph-session-message.model';
import { expandCollapseAnimation } from '../../../../../../shared/animations/animations-expand-collapse';
import { GetProjectRequest } from '../../../../../projects-page/models/project.model';

@Component({
  selector: 'app-finish-message',
  standalone: true,
  imports: [CommonModule, NgxJsonViewerModule, MarkdownModule],
  animations: [expandCollapseAnimation],
  template: `
    <div class="finish-container">
      <!-- Finish Message Header with Toggle -->
      <div class="finish-header" (click)="toggleMessage()">
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
          <i class="ti ti-flag-filled"></i>
        </div>
        <h3>
          <span class="project-name" *ngIf="project && project.name">{{
            project.name
          }}</span>
          <span *ngIf="!project || !project.name">Default Project</span>
          finished
        </h3>
      </div>

      <!-- Collapsible Finish Content -->
      <div
        class="collapsible-content"
        [@expandCollapse]="isMessageExpanded ? 'expanded' : 'collapsed'"
      >
        <div class="finish-content">
          <!-- Variables Section -->
          <div class="variables-container" *ngIf="hasVariables()">
            <div class="section-heading" (click)="toggleSection('variables')">
              <i
                class="ti"
                [ngClass]="
                  isVariablesExpanded
                    ? 'ti-caret-down-filled'
                    : 'ti-caret-right-filled'
                "
              ></i>
              Variables
            </div>
            <div
              class="collapsible-content"
              [@expandCollapse]="isVariablesExpanded ? 'expanded' : 'collapsed'"
            >
              <div class="variables-content">
                <ngx-json-viewer
                  [json]="getVariables()"
                  [expanded]="false"
                ></ngx-json-viewer>
              </div>
            </div>
          </div>

          <!-- Final Output Section -->
          <div class="output-container">
            <div class="section-heading" (click)="toggleSection('output')">
              <i
                class="ti"
                [ngClass]="
                  isOutputExpanded
                    ? 'ti-caret-down-filled'
                    : 'ti-caret-right-filled'
                "
              ></i>
              Final Output
            </div>
            <div
              class="collapsible-content"
              [@expandCollapse]="isOutputExpanded ? 'expanded' : 'collapsed'"
            >
              <div class="output-wrapper">
                <div
                  class="markdown-content"
                  [ngClass]="{ collapsed: isCollapsed && shouldShowToggle() }"
                >
                  <markdown [data]="getMarkdownOutput()"></markdown>
                </div>
                <button
                  *ngIf="shouldShowToggle() && isOutputExpanded"
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
      .finish-container {
        position: relative;
        background-color: var(--gray-850);
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid #5672cd;
      }

      .finish-header {
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
        color: #5672cd;
        font-size: 1.1rem;
        transition: transform 0.3s ease;
      }

      .icon-container {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: #5672cd;
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

      .project-name {
        color: #5672cd;
        font-weight: 400;
        margin-right: 5px;
      }

      .finish-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-left: 5.5rem;
        margin-top: 1.25rem;
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
        color: #5672cd;
        font-size: 1.1rem;
        margin-left: -3px;
        transition: transform 0.3s ease;
      }

      /* Collapsible content container */
      .collapsible-content {
        overflow: hidden;
        position: relative;
      }

      .collapsible-content.ng-animating {
        overflow: hidden;
      }

      .output-wrapper {
        margin-left: 23px;
      }

      .markdown-content {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        color: var(--gray-200);
        overflow-x: auto;
        transition: max-height 0.3s ease;
      }

      .markdown-content.collapsed {
        max-height: 200px;
        overflow-y: hidden;
      }

      .variables-content {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        overflow: auto;
        max-height: 400px;
        margin-left: 23px;
      }

      .toggle-button {
        background-color: transparent;
        border: none;
        color: #5672cd;
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
    `,
  ],
})
export class FinishMessageComponent implements OnInit {
  @Input() message!: GraphMessage;
  @Input() project: GetProjectRequest | null = null; // Add input for project data

  isMessageExpanded = false;
  isOutputExpanded = true;
  isVariablesExpanded = false;
  isCollapsed = false; // Set to false by default to show full output initially

  ngOnInit() {}

  toggleMessage(): void {
    this.isMessageExpanded = !this.isMessageExpanded;
  }

  toggleSection(section: 'output' | 'variables'): void {
    if (section === 'output') {
      this.isOutputExpanded = !this.isOutputExpanded;
    } else if (section === 'variables') {
      this.isVariablesExpanded = !this.isVariablesExpanded;
    }
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  shouldShowToggle(): boolean {
    const output = this.getMarkdownOutput();
    if (!output) return false;

    // Same logic as in other components - show toggle for content longer than 5 lines or 500 characters
    return output.split('\n').length > 5 || output.length > 500;
  }

  getFinishData(): FinishMessageData | null {
    if (
      this.message.message_data &&
      this.message.message_data.message_type === 'finish'
    ) {
      return this.message.message_data as FinishMessageData;
    }
    return null;
  }

  getHeaderText(): string {
    // This method is no longer used in the template, but kept for backward compatibility
    if (this.project && this.project.name) {
      return `${this.project.name} Finished`;
    }
    return 'Default Project Finished';
  }

  getMarkdownOutput(): string {
    const finishData = this.getFinishData();
    if (!finishData || !finishData.output) return '';

    // Check specifically for output.raw
    if (typeof finishData.output === 'object' && finishData.output.raw) {
      return finishData.output.raw;
    }

    // If output.raw doesn't exist, return an empty string
    return '';
  }

  hasVariables(): boolean {
    const finishData = this.getFinishData();
    if (!finishData || !finishData.state) return false;

    // Check if state has variables or state_history
    return (
      !!finishData.state['variables'] &&
      Object.keys(finishData.state['variables']).length > 0
    );
  }

  getVariables(): any {
    const finishData = this.getFinishData();
    if (!finishData || !finishData.state || !finishData.state['variables'])
      return {};

    // Return only the variables value directly
    return finishData.state['variables'] || {};
  }
}

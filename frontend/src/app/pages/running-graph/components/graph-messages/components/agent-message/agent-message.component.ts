import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphMessage } from '../../graph-session-message.model';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { expandCollapseAnimation } from '../../../../../../shared/animations/animations-expand-collapse';
import { GetAgentRequest } from '../../../../../../shared/models/agent.model';

@Component({
  selector: 'app-agent-message',
  standalone: true,
  imports: [CommonModule, NgxJsonViewerModule],
  animations: [expandCollapseAnimation],
  template: `
    <div class="agent-flow-container">
      <!-- Agent Message Header with Toggle -->
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
          <i class="ti ti-robot"></i>
        </div>
        <div class="header-text">
          Action done by <span class="agent-name">{{ getAgentName() }}</span>
        </div>
      </div>

      <!-- Collapsible Agent Content -->
      <div
        class="collapsible-content"
        [@expandCollapse]="isMessageExpanded ? 'expanded' : 'collapsed'"
      >
        <div class="agent-content">
          <!-- Thought Section -->
          <div class="thought-container" *ngIf="hasThought()">
            <div class="section-heading" (click)="toggleSection('thought')">
              <i
                class="ti"
                [ngClass]="
                  isThoughtExpanded
                    ? 'ti-caret-down-filled'
                    : 'ti-caret-right-filled'
                "
              ></i>
              Thought
            </div>
            <div
              class="collapsible-content"
              [@expandCollapse]="isThoughtExpanded ? 'expanded' : 'collapsed'"
            >
              <div class="thought-bubble">
                <span class="thought-quote">"</span
                >{{ cleanThought(getThought())
                }}<span class="thought-quote">"</span>
              </div>
            </div>
          </div>

          <!-- Tool Section -->
          <div class="tool-container" *ngIf="hasTool()">
            <div class="section-heading" (click)="toggleSection('tool')">
              <i
                class="ti"
                [ngClass]="
                  isToolExpanded
                    ? 'ti-caret-down-filled'
                    : 'ti-caret-right-filled'
                "
              ></i>
              Tool
            </div>
            <div
              class="collapsible-content"
              [@expandCollapse]="isToolExpanded ? 'expanded' : 'collapsed'"
            >
              <div class="tool-wrapper">
                <div class="tool-name">{{ getTool() }}</div>
                <div class="tool-input-container" *ngIf="hasToolInput()">
                  <ngx-json-viewer
                    *ngIf="isValidJson(getToolInput())"
                    [json]="getParsedJson()"
                    [expanded]="false"
                  ></ngx-json-viewer>
                  <div
                    class="code-content"
                    *ngIf="!isValidJson(getToolInput())"
                  >
                    {{ formatJson(getToolInput()) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Section as Separate Message Bubble -->
    <div class="result-message-container">
      <div class="result-content">
        {{ getResult() }}
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .agent-flow-container {
        background-color: var(--gray-850);
        border-radius: 8px;
        padding: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid #8e5cd9;
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
        color: #8e5cd9;
        font-size: 1.1rem;
        transition: transform 0.3s ease;
      }

      .icon-container {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: #8e5cd9;
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

      .header-text {
        flex: 1;
        color: var(--gray-100);
        font-size: 1.1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .agent-name {
        color: #8e5cd9;
        font-weight: 400;
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
        color: #8e5cd9;
        font-size: 1.1rem;
        margin-left: -3px;
        transition: transform 0.3s ease;
      }

      .thought-bubble {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        position: relative;
        color: var(--gray-200);
        font-style: italic;
        margin-left: 23px;
      }

      .thought-quote {
        color: #8e5cd9;
        font-size: 1.5rem;
        font-weight: bold;
        vertical-align: sub;
        line-height: 0;
      }

      .tool-wrapper {
        margin-left: 23px;
      }

      .tool-name {
        font-weight: 600;
        color: #8e5cd9;
        margin-bottom: 0.5rem;
      }

      .tool-input-container {
        background-color: var(--gray-800);
        border: 1px solid var(--gray-750);
        border-radius: 8px;
        padding: 1rem;
        overflow: auto;
        max-height: 400px;
        padding-inline: 3px;
      }

      .input-label {
        font-weight: 500;
        color: var(--gray-300);
        margin-bottom: 0.5rem;
      }

      .formatted-content {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
        color: var(--gray-200);
      }

      /* Task Result Styling - Message Bubble */
      .result-message-container {
        max-width: 85%;
        position: relative;
      }

      .result-content {
        background-color: var(--gray-800);
        border-radius: 18px;
        border-top-left-radius: 4px;
        padding: 1rem;
        color: #e3e3e3;
        word-break: break-word;
        overflow-y: auto;
        transition: max-height 0.3s ease;
        box-shadow: 0 4px 12px rgba(14, 14, 14, 0.25);
        position: relative;
        white-space: pre-wrap;
      }

      .result-content.collapsed {
        max-height: 300px;
        overflow: hidden;
      }

      .toggle-button {
        background-color: transparent;
        border: none;
        color: #8e5cd9;
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
export class AgentMessageComponent implements OnInit {
  @Input() message!: GraphMessage;
  @Input() agent: GetAgentRequest | null = null; // Add input for agent data

  isMessageExpanded = false;
  isThoughtExpanded = true;
  isToolExpanded = true;
  isResultExpanded = true;
  isCollapsed = true;
  parsedJson: any = null;

  ngOnInit() {
    if (this.hasToolInput()) {
      this.tryParseJson();
    }
  }

  toggleMessage(): void {
    this.isMessageExpanded = !this.isMessageExpanded;
  }

  toggleSection(section: 'thought' | 'tool' | 'result'): void {
    if (section === 'thought') {
      this.isThoughtExpanded = !this.isThoughtExpanded;
    } else if (section === 'tool') {
      this.isToolExpanded = !this.isToolExpanded;
    } else if (section === 'result') {
      this.isResultExpanded = !this.isResultExpanded;
    }
  }

  getAgentName(): string {
    // If we have the agent data, use the agent's role
    if (this.agent && this.agent.role) {
      // Limit agent name to 50 characters
      const name = this.agent.role;
      return name.length > 50 ? name.substring(0, 50) + '...' : name;
    }

    // Fall back to the previous implementation
    if (!this.message.message_data) return 'Agent';

    if (
      this.message.message_data.message_type === 'agent' &&
      'agent_id' in this.message.message_data
    ) {
      return `Agent #${String(this.message.message_data.agent_id)}`;
    }

    return 'Agent';
  }

  getAgentId(): string {
    if (!this.message.message_data) return 'Unknown';

    if (
      this.message.message_data.message_type === 'agent' &&
      'agent_id' in this.message.message_data
    ) {
      return String(this.message.message_data.agent_id);
    }

    return 'Unknown';
  }

  getProjectId(): string {
    if (!this.message.message_data) return 'Unknown';

    if (
      this.message.message_data.message_type === 'agent' &&
      'crew_id' in this.message.message_data
    ) {
      return String(this.message.message_data.crew_id);
    }

    return 'Unknown';
  }

  hasThought(): boolean {
    if (!this.message.message_data) return false;

    return (
      this.message.message_data.message_type === 'agent' &&
      'thought' in this.message.message_data &&
      !!this.message.message_data.thought
    );
  }

  getThought(): string {
    if (!this.hasThought()) return '';
    return (this.message.message_data as any).thought;
  }

  cleanThought(thought: string): string {
    // Remove markdown code block syntax if present
    return thought
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .replace(/^Thought: /g, '') // Use global flag to remove all occurrences
      .replace(/Thought: /g, '') // Remove any other occurrences
      .trim();
  }

  hasTool(): boolean {
    if (!this.message.message_data) return false;

    return (
      this.message.message_data.message_type === 'agent' &&
      'tool' in this.message.message_data &&
      !!this.message.message_data.tool
    );
  }

  getTool(): string {
    if (!this.hasTool()) return '';
    return (this.message.message_data as any).tool;
  }

  hasToolInput(): boolean {
    if (!this.message.message_data) return false;

    return (
      this.message.message_data.message_type === 'agent' &&
      'tool_input' in this.message.message_data &&
      !!this.message.message_data.tool_input
    );
  }

  getToolInput(): string {
    if (!this.hasToolInput()) return '';
    return (this.message.message_data as any).tool_input;
  }

  tryParseJson(): void {
    if (this.hasToolInput()) {
      try {
        this.parsedJson = JSON.parse(this.getToolInput());
      } catch (e) {
        this.parsedJson = null;
      }
    }
  }

  isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  getParsedJson() {
    if (!this.parsedJson) {
      this.tryParseJson();
    }
    return this.parsedJson;
  }

  formatJson(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      // Using more explicit formatting to ensure proper indentation and brackets
      let formatted = JSON.stringify(parsed, null, 2);
      return formatted;
    } catch (e) {
      return jsonString;
    }
  }

  getResult(): string {
    return (this.message.message_data as any).result.trim();
  }
}

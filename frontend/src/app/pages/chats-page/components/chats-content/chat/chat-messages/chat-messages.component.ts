// chat-messages.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  signal,
} from '@angular/core';
import { NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { ConsoleService } from '../../../../services/console.service';
import { ChatsService } from '../../../../services/chats.service';
import { FullAgent } from '../../../../../../services/full-agent.service';

interface GroupedMessage {
  role: string | undefined;
  ids: string[];
  items: ItemType[];
  timestamp?: string;
  groupId?: string; // Added for trackBy
}

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, NgClass, NgFor, NgIf, MarkdownModule],
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessagesComponent {
  // Get the conversation items directly from the ConsoleService
  conversationItems = computed(() => this.consoleService.items());
  private previousItemCount = 0;

  // Track expanded/collapsed state of tool responses
  expandedResponses = signal<Record<string, boolean>>({});

  // Compute the grouped messages based on the items
  groupedMessages = computed(() => {
    const items = this.conversationItems();
    if (!items || items.length === 0) return [];

    // Group messages by role and consecutive occurrences
    const groups: GroupedMessage[] = [];
    let currentGroup: GroupedMessage | null = null;

    for (const item of items) {
      // If first item or different role from previous, create a new group
      if (!currentGroup || currentGroup.role !== item.role) {
        if (currentGroup) {
          // Generate a unique groupId based on the first message id
          currentGroup.groupId = `group-${currentGroup.ids[0]}`;
          groups.push(currentGroup);
        }

        // Use timestamp from item metadata or current time as fallback
        const timestamp = this.getTimestampFromItem(item);

        currentGroup = {
          role: item.role,
          ids: [item.id],
          items: [item],
          timestamp: this.formatTime(timestamp),
        };
      } else {
        // Add to current group
        currentGroup.ids.push(item.id);
        currentGroup.items.push(item);
        // Update timestamp to the latest message
        const timestamp = this.getTimestampFromItem(item);
        currentGroup.timestamp = this.formatTime(timestamp);
      }
    }

    // Add the last group if it exists
    if (currentGroup) {
      // Generate a unique groupId for the last group
      currentGroup.groupId = `group-${currentGroup.ids[0]}`;
      groups.push(currentGroup);
    }

    return groups;
  });

  constructor(
    public consoleService: ConsoleService,
    public chatsService: ChatsService
  ) {
    effect(() => {
      const currentItems = this.consoleService.items();

      // Check if new items were added
      if (currentItems.length > this.previousItemCount) {
        // Log only the new items
        for (let i = this.previousItemCount; i < currentItems.length; i++) {
          console.log('New conversation item:', currentItems[i]);
        }
        // Update the previous count
        this.previousItemCount = currentItems.length;
      }
    });
  }

  get agent(): FullAgent | null {
    return this.chatsService.selectedAgent$();
  }

  // Helper to safely get a timestamp from an item
  private getTimestampFromItem(item: ItemType): Date {
    // Try to get the timestamp from various possible properties
    // Use type assertion with 'as any' to bypass TypeScript strictness
    const timestampStr =
      (item as any).created_at ||
      (item as any).timestamp ||
      (item as any).created;

    return timestampStr ? new Date(timestampStr) : new Date();
  }

  public getDisplayUserText(item: ItemType): string {
    if (!item.formatted) return '(...)';

    const { transcript, audio, text } = item.formatted;

    if (audio?.length && (transcript === ' ' || transcript === '\n')) {
      return '[inaudible]';
    }

    if (transcript) {
      return transcript;
    }

    if (audio?.length) {
      return '(awaiting transcript)';
    }

    return text || '(...)';
  }

  public getAssistantText(item: ItemType): string {
    if (!item.formatted) return '(...)';

    if (item.formatted.transcript) {
      return item.formatted.transcript;
    }

    if (item.formatted.text) {
      return item.formatted.text;
    }

    return '(truncated)';
  }

  // Helper method to get formatted timestamp
  formatTime(timestamp?: Date): string {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Toggle the expanded/collapsed state for a tool response
  toggleResponseVisibility(itemId: string): void {
    this.expandedResponses.update((current) => {
      const newState = { ...current };
      newState[itemId] = !current[itemId];
      return newState;
    });
  }

  // Check if a tool response is expanded
  isResponseExpanded(itemId: string): boolean {
    return !!this.expandedResponses()[itemId];
  }

  // TrackBy function for message groups to improve performance
  trackByGroupId(index: number, group: GroupedMessage): string {
    return group.groupId || `fallback-group-${index}`;
  }

  // TrackBy function for message items to improve performance
  trackByItemId(index: number, item: ItemType): string {
    return item.id || `fallback-item-${index}`;
  }
}

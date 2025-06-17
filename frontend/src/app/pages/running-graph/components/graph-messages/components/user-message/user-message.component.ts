import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import {
  GraphMessage,
  UserMessageData,
  MessageType,
} from '../../../../models/graph-session-message.model';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  template: `
    <div class="user-message-container">
      <div class="message-bubble">
        <markdown [data]="getMessageText()" class="markdown-content"></markdown>
      </div>
    </div>
  `,
  styles: [
    `
      .user-message-container {
        display: flex;
        justify-content: flex-end;
        position: relative;
      }

      .message-bubble {
        background-color: #ffa726;
        border-radius: 18px 18px 0 18px;
        padding: 0.75rem 1rem;
        color: var(--gray-900);
        max-width: 85%;
        word-break: break-word;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      }

      .markdown-content {
        color: var(--gray-900);
      }

      .markdown-content ::ng-deep p:first-child {
        margin-top: 0;
      }

      .markdown-content ::ng-deep p:last-child {
        margin-bottom: 0;
      }
    `,
  ],
})
export class UserMessageComponent {
  @Input() message!: GraphMessage;

  get userMessageData(): UserMessageData | null {
    if (
      this.message.message_data &&
      this.message.message_data.message_type === MessageType.USER
    ) {
      return this.message.message_data as UserMessageData;
    }
    return null;
  }

  getMessageText(): string {
    if (this.userMessageData?.text === '</done/>') {
      return 'Done';
    }
    return this.userMessageData?.text || '';
  }
}

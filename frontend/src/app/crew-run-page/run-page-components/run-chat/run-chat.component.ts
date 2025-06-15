import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { RunChatHeaderComponent } from './run-chat-header/run-chat-header.component';
import { RunCrewSessionService } from '../../../services/run-crew-session.service';
import { forkJoin, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CrewRunMessage } from '../../../shared/models/crew_run_message.model';

interface TextSegment {
  text: string;
  cssClass?: string;
}

const ANSI_COLORS_REGEX: RegExp = /\u001b\[(\d{1,2})m/g;
const ANSI_TO_CSS_CLASS: { [key: string]: string } = {
  '30': 'ansi-black',
  '31': 'ansi-red',
  '32': 'ansi-green',
  '33': 'ansi-yellow',
  '34': 'ansi-blue',
  '35': 'ansi-magenta',
  '36': 'ansi-cyan',
  '37': 'ansi-white',
  '90': 'ansi-grey',
  '91': 'ansi-lightcoral',
  '92': 'ansi-black',
  '93': 'ansi-lightyellow',
  '94': 'ansi-lightblue',
  '95': 'ansi-blue',
  '96': 'ansi-lightcyan',
  '97': 'ansi-lightgray',
};

@Component({
  selector: 'app-run-chat',
  standalone: true,
  imports: [
    RunChatHeaderComponent,
    FormsModule,
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './run-chat.component.html',
  styleUrls: ['./run-chat.component.scss'],
})
export class RunChatComponent implements OnInit, OnDestroy {
  @Input() sessionId!: number;
  public chatStatus!: string;

  public messages: Array<CrewRunMessage & { segments?: TextSegment[] }> = [];

  private messagesSubscription!: Subscription;

  constructor(private runCrewSessionService: RunCrewSessionService) {}

  ngOnInit(): void {
    this.messagesSubscription = timer(0, 2000)
      .pipe(
        switchMap(() =>
          forkJoin({
            messages: this.runCrewSessionService.getMessages(this.sessionId),
            session: this.runCrewSessionService.getSession(this.sessionId),
          })
        )
      )
      .subscribe({
        next: ({ messages, session }) => {
          // Update messages
          this.messages = messages.map((msg) => {
            const segments = this.parseAnsiText(msg.text);
            return {
              ...msg,
              segments: segments,
            };
          });

          // Update chatStatus based on session status
          if (session.status === 'end') {
            this.chatStatus = 'finished';
          } else if (session.status === 'run') {
            this.chatStatus = 'running';
          } else {
            this.chatStatus = session.status;
          }

          console.log('Chat Status:', this.chatStatus);
          console.log(this.messages);
        },
        error: (error: Error) => {
          console.error('Error fetching messages or session status:', error);
        },
      });
  }

  private parseAnsiText(text: string): TextSegment[] {
    if (!text) return [];

    text = text.replace(/^\n+/, '');

    const segments: TextSegment[] = [];
    let lastIndex: number = 0;
    let currentClass: string | undefined;

    let match: RegExpExecArray | null;
    while ((match = ANSI_COLORS_REGEX.exec(text)) !== null) {
      const index: number = match.index;
      const code: string = match[1];

      if (index > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, index),
          cssClass: currentClass,
        });
      }

      currentClass = code === '0' ? undefined : ANSI_TO_CSS_CLASS[code];

      lastIndex = ANSI_COLORS_REGEX.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        cssClass: currentClass,
      });
    }

    return segments;
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }
}

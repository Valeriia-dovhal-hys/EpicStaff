import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { RunChatHeaderComponent } from './run-chat-header/run-chat-header.component';
import {
  RunCrewSessionService,
  Message,
  GetMessagesResponse,
} from '../../../services/run-crew-session.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import AnsiToHtml from 'ansi-to-html';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
export class ChatComponent implements OnInit, OnDestroy {
  @Input() sessionId!: number;
  chatStatus: string = 'running';

  pollingSubscription!: Subscription;
  messages: Array<Message & { htmlText?: SafeHtml }> = [];

  private ansiConvert: AnsiToHtml;

  constructor(
    private runCrewSessionService: RunCrewSessionService,
    private sanitizer: DomSanitizer
  ) {
    // Initialize AnsiToHtml with custom color mappings
    this.ansiConvert = new AnsiToHtml({
      colors: {
        // Map bright magenta (ANSI code 95) to blue
        95: '#0000FF',
        // Map bright green (ANSI code 92) to black
        92: '#000000',
      },
    });
  }

  ngOnInit(): void {
    this.pollingSubscription = timer(0, 2000)
      .pipe(
        switchMap(() => this.runCrewSessionService.getMessages(this.sessionId))
      )
      .subscribe({
        next: (response: GetMessagesResponse) => {
          this.messages = response.results.map((msg) => {
            const replacedText = this.replaceAnsiColorCodes(msg.text);
            const htmlText = this.ansiConvert.toHtml(replacedText);
            const safeHtmlText =
              this.sanitizer.bypassSecurityTrustHtml(htmlText);

            return {
              ...msg,
              htmlText: safeHtmlText,
            };
          });
          console.log(this.messages);
        },
        error: (error: Error) => {
          console.error('Error fetching messages:', error);
        },
      });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // Method to remove leading newline characters and replace ANSI color codes
  private replaceAnsiColorCodes(text: string): string {
    if (!text) return text;

    // Remove any leading newline characters
    text = text.replace(/^\n+/, '');

    // Replace bright magenta (ANSI code 95) with bright blue (ANSI code 94)
    text = text.replace(/\u001b\[95m/g, '\u001b[94m');
    // Replace bright green (ANSI code 92) with black (ANSI code 30)
    text = text.replace(/\u001b\[92m/g, '\u001b[30m');

    return text;
  }
}

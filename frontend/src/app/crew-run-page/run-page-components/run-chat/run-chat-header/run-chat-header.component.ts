import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-run-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './run-chat-header.component.html',
  styleUrl: './run-chat-header.component.scss',
})
export class RunChatHeaderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() chatStatus!: string;
  timer: string = '00:00:00';
  private intervalId: any;
  private secondsElapsed: number = 0;

  ngOnInit() {
    this.startTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatStatus']) {
      if (this.chatStatus === 'finished' || this.chatStatus === 'error') {
        // Stop the timer
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      } else if (this.chatStatus === 'running' && !this.intervalId) {
        this.startTimer();
      }
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startTimer() {
    this.intervalId = setInterval(() => {
      this.secondsElapsed++;
      this.timer = this.formatTime(this.secondsElapsed);
    }, 1000);
  }

  // Helper function to format seconds into HH:MM:SS
  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
      this.padZero(hours) +
      ':' +
      this.padZero(minutes) +
      ':' +
      this.padZero(seconds)
    );
  }

  private padZero(value: number): string {
    return value < 10 ? '0' + value : value.toString();
  }
}

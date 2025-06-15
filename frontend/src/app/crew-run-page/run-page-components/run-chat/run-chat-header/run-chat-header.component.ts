import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-run-chat-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './run-chat-header.component.html',
  styleUrl: './run-chat-header.component.scss',
})
export class RunChatHeaderComponent implements OnInit, OnDestroy {
  @Input() chatStatus!: string;
  timer: string = '00:00:00';
  private intervalId: any;
  private secondsElapsed: number = 0;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.secondsElapsed++;
      this.timer = this.formatTime(this.secondsElapsed);
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Helper function to format seconds into HH:MM:SS
  // probable could use pipe for that
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

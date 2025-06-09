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
  @Input() chatStatus: string = 'running'; // Receive status from parent if needed
  timer: string = '00:00:00';
  private intervalId: any;
  private secondsElapsed: number = 0;

  ngOnInit() {
    // Start the timer when the component loads
    this.intervalId = setInterval(() => {
      this.secondsElapsed++;
      this.timer = this.formatTime(this.secondsElapsed);
    }, 1000); // Updates every second
  }

  ngOnDestroy() {
    // Clear the timer when the component is destroyed to prevent memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
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

  // Helper function to pad with zero if less than 10
  private padZero(value: number): string {
    return value < 10 ? '0' + value : value.toString();
  }
}

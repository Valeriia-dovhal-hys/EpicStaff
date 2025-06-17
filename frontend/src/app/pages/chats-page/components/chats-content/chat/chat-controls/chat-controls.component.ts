// chat-controls.component.ts
import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsoleService } from '../../../../services/console.service';
import { MicrophoneSelectorComponent } from './microphone-selector/microphone-selector.component';
import { VoiceVisualizerComponent } from './voice-visualizer/voice-visualizer.component';

@Component({
  selector: 'app-chat-controls',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MicrophoneSelectorComponent,
    VoiceVisualizerComponent,
  ],
  templateUrl: './chat-controls.component.html',
  styleUrls: ['./chat-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatControlsComponent {
  // Convert isPaused to a signal
  isMicrophoneMuted = signal(false);
  isKeyboardMode = false;
  messageText = '';

  constructor(public consoleService: ConsoleService) {}

  onStartSpeaking(): void {
    this.isMicrophoneMuted.set(false);
    this.consoleService.connectConversation();
  }

  toggleRecording(): void {
    if (this.isMicrophoneMuted()) {
      this.consoleService.recordWavRecorder();
      this.isMicrophoneMuted.set(false);
    } else {
      this.consoleService.pauseWavRecorder();
      this.isMicrophoneMuted.set(true);
    }
  }

  stopConversation(): void {
    this.consoleService.disconnectConversation();
    this.isMicrophoneMuted.set(false);
    this.isKeyboardMode = false;
  }

  toggleInputMode(): void {
    this.isKeyboardMode = !this.isKeyboardMode;

    if (!this.isKeyboardMode && this.isMicrophoneMuted()) {
      // If switching back to microphone mode and it was muted, unmute it
      this.consoleService.recordWavRecorder();
      this.isMicrophoneMuted.set(false);
    } else if (this.isKeyboardMode && !this.isMicrophoneMuted()) {
      // If switching to keyboard mode and microphone is active, pause it
      this.consoleService.pauseWavRecorder();
      this.isMicrophoneMuted.set(true);
    }
  }

  sendMessage(): void {
    if (this.messageText.trim()) {
      // Implement your send message logic here
      this.consoleService.sendTextMessage(this.messageText);
      console.log('Sending message:', this.messageText);

      // Clear the input after sending
      this.messageText = '';
    }
  }

  public get isConversationSetuped() {
    return (
      this.consoleService.isClientConnected() &&
      this.consoleService.isConversationConnected() &&
      this.consoleService.isRecordingStarted()
    );
  }

  ngOnDestroy() {}
}

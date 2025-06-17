import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullAgent } from '../../../../../../services/full-agent.service';
import { ChatsService } from '../../../../services/chats.service';
import { ConsoleService } from '../../../../services/console.service';

import { TinyAudioVisualizerComponent } from '../chat-controls/frequency-circle/frequency-circle.component';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TinyAudioVisualizerComponent],
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.scss'],
})
export class ChatHeaderComponent implements OnInit {
  @Input() communicationType: 'audio' | 'text' = 'audio';
  @Input() selectedVoice: string = 'Jake';
  @Input() voices: string[] = ['Jake', 'Lucio', 'Mark'];

  @Output() communicationTypeChange = new EventEmitter<'audio' | 'text'>();
  @Output() voiceChange = new EventEmitter<string>();

  showSettings = false;
  threshold = 0.65;
  searchLimit = 300;

  constructor(
    public chatsService: ChatsService,
    public consoleService: ConsoleService
  ) {}

  ngOnInit(): void {
    // Initialize values from ConsoleService
    this.threshold = this.consoleService.threshold();
    this.searchLimit = this.consoleService.searchLimit();
  }

  get agent(): FullAgent | null {
    return this.chatsService.selectedAgent$();
  }

  toggleCommunicationType(type: 'audio' | 'text') {
    this.communicationType = type;
    this.communicationTypeChange.emit(type);
  }

  onVoiceChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.voiceChange.emit(select.value);
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  onThresholdChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.threshold = parseFloat(input.value);
    // Update the service value
    this.consoleService.updateThreshold(this.threshold);
  }

  onSearchLimitChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchLimit = parseFloat(input.value);
    // Update the service value
    this.consoleService.updateSearchLimit(this.searchLimit);
  }
}

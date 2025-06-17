import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
} from '@angular/core';
import { ChatsService } from '../../../services/chats.service';
import { FullAgent } from '../../../../../services/full-agent.service';
import { ConsoleService } from '../../../services/console.service';

@Component({
  selector: 'app-chats-sidebar-item',
  standalone: true,
  templateUrl: './chats-sidebar-item.component.html',
  styleUrls: ['./chats-sidebar-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatsSidebarItemComponent {
  @Input() agent!: FullAgent;

  isSelected = computed(
    () => this.chatsService.selectedAgentId$() === this.agent.id
  );

  constructor(
    private chatsService: ChatsService,
    private consoleService: ConsoleService
  ) {}

  onSelect() {
    this.chatsService.setSelectedAgent(this.agent);
    if (this.consoleService.isConversationConnected()) {
      this.consoleService.disconnectConversation();
    }
  }
}

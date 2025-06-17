import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChatsSidebarItemComponent } from './chats-sidebar-item/chats-sidebar-item.component';
import { NgFor } from '@angular/common';
import { ChatsService } from '../../services/chats.service';
import { FullAgent } from '../../../../services/full-agent.service';

@Component({
  selector: 'app-chats-sidebar',
  standalone: true,
  imports: [NgFor, ChatsSidebarItemComponent],
  templateUrl: './chats-sidebar.component.html',
  styleUrls: ['./chats-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatsSidebarComponent {
  @Input() agents: FullAgent[] = [];

  constructor(private chatsService: ChatsService) {}

  get selectedAgentId() {
    return this.chatsService.selectedAgentId$;
  }
}

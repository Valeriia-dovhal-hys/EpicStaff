import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  signal,
  WritableSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChatsService } from './services/chats.service';
import { FullAgent, FullAgentService } from '../../services/full-agent.service';
import { PageHeaderComponent } from '../../shared/components/header/page-header.component';
import { ChatsSidebarComponent } from './components/chats-sidebar/chats-sidebar.component';
import { ChatsContentComponent } from './components/chats-content/chats-content.component';
import { NgIf } from '@angular/common';
import { ChatsHeaderComponent } from './components/chats-page-header/chats-page-header.component';
import { ConsoleService } from './services/console.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { finalize, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [
    ChatsSidebarComponent,
    ChatsContentComponent,
    ChatsHeaderComponent,
    NgIf,
    SpinnerComponent,
  ],
  templateUrl: './chats-page.component.html',
  styleUrls: ['./chats-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatsPageComponent implements OnInit, OnDestroy {
  public agentsList = signal<FullAgent[]>([]);
  public isLoading = signal<boolean>(true);

  private destroy$ = new Subject<void>();

  constructor(
    private readonly chatsService: ChatsService,
    private readonly fullAgentService: FullAgentService,
    private consoleService: ConsoleService
  ) {}

  ngOnInit(): void {
    this.loadFullAgents();
  }

  private loadFullAgents(): void {
    // Set a minimum loading time of 500ms
    const loadStartTime = Date.now();

    this.fullAgentService
      .getFullAgents()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Calculate remaining time to reach minimum 500ms loading time
          const loadTime = Date.now() - loadStartTime;
          const remainingTime = Math.max(0, 500 - loadTime);

          // Use setTimeout to ensure minimum loading time
          setTimeout(() => {
            this.isLoading.set(false);
          }, remainingTime);
        })
      )
      .subscribe((agents) => {
        this.agentsList.set(agents);

        if (agents.length > 0) {
          this.chatsService.setSelectedAgent(agents[0]);
        }
      });
  }

  ngOnDestroy() {
    this.consoleService.disconnectConversation();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

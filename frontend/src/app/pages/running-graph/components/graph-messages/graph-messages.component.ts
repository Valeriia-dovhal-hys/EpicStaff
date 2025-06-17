import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { GraphSessionMessagesService } from '../../../../services/graph-sessions-messages.service';
import { AgentsService } from '../../../../services/staff.service';
import { TasksService } from '../../../../services/tasks.service';
import { ProjectsStorageService } from '../../../../features/projects/services/projects-storage.service';
import { LoadingDotsComponent } from './components/loading-animation/loading-animation.component';

import { GetAgentRequest } from '../../../../shared/models/agent.model';
import { GetTaskRequest } from '../../../../shared/models/task.model';
import { GetProjectRequest } from '../../../../features/projects/models/project.model';
import { forkJoin, interval, Subject, of } from 'rxjs';
import {
  takeUntil,
  switchMap,
  catchError,
  map,
  takeWhile,
  startWith,
} from 'rxjs/operators';

import {
  GraphSessionStatus,
  GraphSession,
  GraphSessionService,
} from '../../../../features/flows/services/flows-sessions.service';
import {
  GraphMessage,
  MessageType,
  UpdateSessionStatusMessageData,
} from '../../models/graph-session-message.model';
import { StartMessageComponent } from './components/start-message/start-message.component';
import { AgentMessageComponent } from './components/agent-message/agent-message.component';
import { TaskMessageComponent } from './components/task-message/task-message.component';
import { PythonMessageComponent } from './components/python-message/python-message.component';
import { LlmMessageComponent } from './components/llm-message/llm-message.component';
import { FinishMessageComponent } from './components/finish-message/finish-message.component';
import { AgentFinishMessageComponent } from './components/agent-finish/agent-finish.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { ProjectTransitionComponent } from './components/transition/project-transition.component';
import { WaitForUserInputComponent } from './components/user-input-component/user-input-component.component';
import { SessionStatusMessageData } from '../../models/update-session-status.model';
import { AnswerToLLMService } from '../../../../services/answerToLLMService.service';
import { UserMessageComponent } from './components/user-message/user-message.component';
import { NoMessagesComponent } from '../no-messages/no-messages.component';
import { isMessageType } from './helper_functions/message-helper';
import { MemoryService } from '../memory-sidebar/service/memory.service';
import { RunGraphPageService } from '../../run-graph-page.service';

@Component({
  selector: 'app-graph-messages',
  standalone: true,
  imports: [
    CommonModule,
    MarkdownModule,
    LoadingDotsComponent,
    StartMessageComponent,
    AgentMessageComponent,
    FinishMessageComponent,
    TaskMessageComponent,
    PythonMessageComponent,
    LlmMessageComponent,
    AgentFinishMessageComponent,
    ErrorMessageComponent,
    ProjectTransitionComponent,
    WaitForUserInputComponent,
    UserMessageComponent,
  ],
  templateUrl: './graph-messages.component.html',
  styleUrls: ['./graph-messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphMessagesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() sessionId: string | null = null;
  @Output() sessionStatusChanged = new EventEmitter<GraphSessionStatus>();
  @Output() messagesChanged = new EventEmitter<GraphMessage[]>();

  // Data arrays and objects
  public messages: GraphMessage[] = [];
  public agents: GetAgentRequest[] = [];
  public tasks: GetTaskRequest[] = [];
  public projects: GetProjectRequest[] = [];
  public session: GraphSession | null = null;
  public GraphSessionStatus = GraphSessionStatus;

  // Animation control for messages
  public animatedIndices: { [key: number]: boolean } = {};
  private messageAnimationDelay = 500;

  // Loading state
  public isLoading = true;

  public showUserInputWithDelay: boolean = false;

  // New property for storing update status data from messages
  public updateSessionStatusData: SessionStatusMessageData | null = null;
  public statusWaitForUser: boolean = false;
  // Lookup maps for quick reference
  private agentMap: Map<number, GetAgentRequest> = new Map();
  private taskMap: Map<number, GetTaskRequest> = new Map();
  private projectMap: Map<number, GetProjectRequest> = new Map();

  private destroy$ = new Subject<void>();
  public shouldPoll = true;

  constructor(
    private messagesService: GraphSessionMessagesService,
    private agentsService: AgentsService,
    private tasksService: TasksService,
    private projectsService: ProjectsStorageService,
    private sessionService: GraphSessionService,
    private cdr: ChangeDetectorRef,
    private answerToLLMService: AnswerToLLMService,
    private memoryService: MemoryService,
    private runGraphPageService: RunGraphPageService // Use RunGraphPageService
  ) {}

  public ngOnInit(): void {
    if (this.sessionId) {
      this.loadInitialData();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionId'] && !changes['sessionId'].firstChange) {
      // Clean up previous subscriptions and state
      this.shouldPoll = false;
      this.destroy$.next();
      this.isLoading = true;
      this.session = null;
      this.messages = [];
      this.animatedIndices = {};
      this.updateSessionStatusData = null;
      this.statusWaitForUser = false;
      this.showUserInputWithDelay = false;
      this.cdr.markForCheck();
      // Load new session data
      if (this.sessionId) {
        this.loadInitialData();
      }
    }
  }

  public ngOnDestroy(): void {
    this.shouldPoll = false;
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    if (!this.sessionId) return;

    forkJoin({
      session: this.sessionService.getSessionById(+this.sessionId),
      messages: this.messagesService.getGraphSessionMessages(this.sessionId),
      agents: this.agentsService.getAgents(),
      tasks: this.tasksService.getTasks(),
      projects: this.projectsService.getProjects(),

      memories: this.memoryService.getMemoriesForSession(this.sessionId), // Fetch memories
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.session = results.session;

          if (this.session) {
            this.sessionStatusChanged.emit(this.session.status);
            this.shouldPoll =
              this.session.status === GraphSessionStatus.RUNNING ||
              this.session.status === GraphSessionStatus.PENDING;
          }

          this.messages = [...results.messages].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
          // Emit the new state of messages
          this.messagesChanged.emit(this.messages);
          this.agents = results.agents;
          this.tasks = results.tasks;
          this.projects = results.projects;

          // Store the fetched memories in the RunGraphPageService
          this.runGraphPageService.setMemories(results.memories);

          this.updateLookupMaps();
          this.processMessages();

          this.setupPolling();

          this.isLoading = false;
          if (this.statusWaitForUser) {
            this.showUserInputWithDelay = true;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading initial data:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private setupPolling(): void {
    interval(2000)
      .pipe(
        takeUntil(this.destroy$),
        startWith(0), // Start immediately
        takeWhile(() => this.shouldPoll),
        switchMap(() => {
          if (!this.sessionId) return of(null);

          return forkJoin({
            session: this.sessionService.getSessionById(+this.sessionId),
            messages: this.messagesService.getGraphSessionMessages(
              this.sessionId
            ),
            memories: this.memoryService.getMemoriesForSession(this.sessionId), // Poll memories
          }).pipe(
            catchError((err) => {
              console.error('Error during polling:', err);
              return of(null);
            })
          );
        })
      )
      .subscribe({
        next: (results) => {
          if (!results) return;

          // Update session and check if status changed
          const oldStatus = this.session?.status;
          this.session = results.session;

          // Emit session status change event if needed
          if (this.session && oldStatus !== this.session.status) {
            this.sessionStatusChanged.emit(this.session.status);
            this.shouldPoll =
              this.session.status === GraphSessionStatus.RUNNING;
          }

          // Store the old message count and status before updating
          const oldMessageCount = this.messages.length;
          const wasWaitingForUser = this.statusWaitForUser;

          // Update messages and process them

          // Update messages using a new array reference and sort them
          this.messages = [...results.messages].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
          // Emit the new state of messages
          this.messagesChanged.emit(this.messages);
          // Process messages to update status flags
          this.processMessages();

          // Calculate number of new messages
          const newMessagesCount = this.messages.length - oldMessageCount;

          // If we have new messages, animate only the new ones
          if (newMessagesCount > 0) {
            this.animateNewMessages(oldMessageCount);
          }

          this.runGraphPageService.setMemories(results.memories);
          this.cdr.markForCheck();
        },
      });
  }

  private processMessages(): void {
    if (this.messages.length > 0) {
      const lastMessage: GraphMessage = this.messages[this.messages.length - 1];

      if (
        lastMessage.message_data &&
        lastMessage.message_data.message_type === 'update_session_status'
      ) {
        // Cast the message_data to SessionStatusMessageData interface
        this.updateSessionStatusData =
          lastMessage.message_data as SessionStatusMessageData;

        // Check if status is "wait_for_user" and update statusWaitForUser flag
        if (this.updateSessionStatusData.status === 'wait_for_user') {
          this.shouldPoll = false;
          this.statusWaitForUser = true;

          // For initial load, show input immediately
          if (this.isLoading) {
            this.showUserInputWithDelay = true;
          }
          // For polling updates, the animation will be handled in setupPolling
        } else {
          this.statusWaitForUser = false;
          this.showUserInputWithDelay = false;
        }
      } else {
        this.updateSessionStatusData = null;
        this.statusWaitForUser = false;
        this.showUserInputWithDelay = false;
      }
    }
  }

  private animateNewMessages(previousCount: number): void {
    for (let i = previousCount; i < this.messages.length; i++) {
      setTimeout(() => {
        this.animatedIndices[i] = true;
        this.cdr.markForCheck();
      }, (i - previousCount) * this.messageAnimationDelay);
    }
  }

  public getAgentFromMessage(message: GraphMessage): GetAgentRequest | null {
    if (!message.message_data) return null;

    if (
      (message.message_data.message_type === 'agent' ||
        message.message_data.message_type === 'agent_finish') &&
      'agent_id' in message.message_data
    ) {
      const agentId = message.message_data.agent_id;
      return this.agentMap.get(agentId) || null;
    }

    return null;
  }

  private updateLookupMaps(): void {
    // Clear existing maps
    this.agentMap.clear();
    this.taskMap.clear();
    this.projectMap.clear();

    // Populate agent map
    this.agents.forEach((agent) => {
      this.agentMap.set(agent.id, agent);
    });

    // Populate task map
    this.tasks.forEach((task) => {
      this.taskMap.set(task.id, task);
    });

    // Populate project map
    this.projects.forEach((project) => {
      this.projectMap.set(project.id, project);
    });

    console.log('Lookup maps updated:', {
      agents: this.agentMap.size,
      tasks: this.taskMap.size,
      projects: this.projectMap.size,
    });
  }

  public getProjectFromMessage(
    message: GraphMessage
  ): GetProjectRequest | null {
    // Return null if message is invalid
    if (!message) return null;

    // Try to find project through message name
    if (message.name) {
      console.log('Using message name for finish message:', message.name);
      return { name: message.name } as GetProjectRequest;
    }

    return null;
  }

  // Check if we should show transition between sessions
  public shouldShowTransition(
    currentMessage: GraphMessage,
    index: number
  ): boolean {
    // Don't show transition for the first message
    if (index === 0) return false;

    const prevMessage = this.messages[index - 1];

    // If current message is 'start' and previous is 'finish', show transition
    return (
      isMessageType(currentMessage, MessageType.START) &&
      isMessageType(prevMessage, MessageType.FINISH)
    );
  }

  onUserMessageSubmitted(message: string) {
    // Log or handle the user message
    console.log('User typed message:', message);

    // Make sure we have valid sessionId and updateSessionStatusData
    if (!this.sessionId) {
      console.warn('No sessionId available; cannot send answer.');
      return;
    }
    if (!this.updateSessionStatusData) {
      console.warn('No updateSessionStatusData available; cannot send answer.');
      return;
    }

    // Prepare the data to send
    const requestData = {
      session_id: +this.sessionId, // convert string to number
      crew_id: this.updateSessionStatusData.crew_id,
      execution_order: this.updateSessionStatusData.status_data.execution_order,
      name: this.updateSessionStatusData.status_data.name,
      answer: message,
    };

    this.answerToLLMService.sendAnswerToLLM(requestData).subscribe({
      next: (response) => {
        console.log('Answer to LLM sent successfully:', response);
        this.shouldPoll = true;
        this.statusWaitForUser = false;

        // this.refreshData();
        this.setupPolling();

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error sending answer to LLM:', error);
      },
    });
  }
}

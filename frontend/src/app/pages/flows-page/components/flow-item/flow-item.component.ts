import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphDto } from '../../../../features/flows/models/graph.model';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { GraphSessionStatus } from '../../../../features/flows/services/flows-sessions.service';
import { EMOJI_CATEGORIES } from '../../../../shared/constants/emoji.constants';
import { GraphWithSessionsInfo } from '../../flows-page.component';

export interface SessionViewRequest {
  graph: GraphWithSessionsInfo;
  filterStatus?: GraphSessionStatus | 'all';
}

@Component({
  selector: 'app-flow-item',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './flow-item.component.html',
  styleUrl: './flow-item.component.scss',
})
export class FlowItemComponent {
  @Input({ required: true }) graph!: GraphWithSessionsInfo;
  @Output() openFlow = new EventEmitter<GraphWithSessionsInfo>();
  @Output() playFlow = new EventEmitter<GraphWithSessionsInfo>();
  @Output() deleteFlow = new EventEmitter<GraphWithSessionsInfo>();
  @Output() editFlow = new EventEmitter<GraphWithSessionsInfo>();
  @Output() viewSessions = new EventEmitter<SessionViewRequest>();

  isMenuOpen = false;
  defaultTags = ['Automated', 'Integration', 'API'];
  sessionStatuses = GraphSessionStatus;

  public getTags(): string[] {
    const sourceTags = this.graph.tags?.length
      ? this.graph.tags
      : this.defaultTags;

    return sourceTags.map((tag) => tag.trim().replace(/^#/, ''));
  }

  public getFlowEmoji(): string {
    // Always use technology emoji category
    const categoryEmojis = EMOJI_CATEGORIES['technology'];
    // Use graph ID for deterministic emoji selection
    const emojiIndex = this.graph.id % categoryEmojis.length;
    return categoryEmojis[emojiIndex];
  }

  public onOpenFlow(): void {
    this.openFlow.emit(this.graph);
  }

  public toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu(): void {
    this.isMenuOpen = false;
  }

  public onPlayFlow(event: Event): void {
    event.stopPropagation();
    this.playFlow.emit(this.graph);
    this.closeMenu();
  }

  public onDeleteFlow(event: Event): void {
    event.stopPropagation();
    this.deleteFlow.emit(this.graph);
    this.closeMenu();
  }

  public onEditFlow(event: Event): void {
    event.stopPropagation();
    this.editFlow.emit(this.graph);
    this.closeMenu();
  }

  public onViewSessions(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.viewSessions.emit({ graph: this.graph, filterStatus: 'all' });
  }

  public onViewSessionsWithFilter(
    event: Event,
    status: GraphSessionStatus
  ): void {
    event.stopPropagation();
    event.preventDefault();
    this.viewSessions.emit({ graph: this.graph, filterStatus: status });
  }

  public hasActiveSessions(): boolean {
    return this.graph.statusesCounts.run > 0;
  }

  public hasWaitingForUserSessions(): boolean {
    return this.graph.statusesCounts.wait_for_user > 0;
  }
}

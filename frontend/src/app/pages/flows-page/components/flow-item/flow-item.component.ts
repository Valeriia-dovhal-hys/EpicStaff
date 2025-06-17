import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphDto } from '../../models/graph.model';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { GraphSessionStatus } from '../../../../services/graph-sessions-status.service';

interface GraphWithSessionsInfo extends GraphDto {
  activeSessionsCount: number;
  waitingForUserSessionsCount: number;
}

export interface SessionViewRequest {
  graph: GraphWithSessionsInfo;
  filterStatus?: GraphSessionStatus | 'all';
}

@Component({
  selector: 'app-flow-item',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './flow-item.component.html',
  styleUrls: ['./flow-item.component.scss'],
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

  public onOpenFlow(): void {
    this.openFlow.emit(this.graph);
  }

  public toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;

    // When opening the menu, add a class to the document body to prevent scrolling if needed
    if (this.isMenuOpen) {
      // Ensure menu stays visible even if it extends beyond the container
      setTimeout(() => {
        // Fix any positioning issues with a short delay to ensure DOM is updated
        const menuElement = document.querySelector(
          '.menu-container'
        ) as HTMLElement;
        if (menuElement) {
          // Check if menu extends beyond viewport and adjust if needed
          const rect = menuElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight;

          if (rect.bottom > viewportHeight) {
            menuElement.style.top = 'auto';
            menuElement.style.bottom = '100%';
          }
        }
      }, 0);
    }
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
    // Make sure the event doesn't bubble up
    event.stopPropagation();
    event.preventDefault();
    this.viewSessions.emit({ graph: this.graph, filterStatus: 'all' });
  }

  public onViewSessionsWithFilter(
    event: Event,
    status: GraphSessionStatus
  ): void {
    // Make sure the event doesn't bubble up
    event.stopPropagation();
    event.preventDefault();
    this.viewSessions.emit({ graph: this.graph, filterStatus: status });
  }

  public hasActiveSessions(): boolean {
    return this.graph.activeSessionsCount > 0;
  }

  public hasWaitingForUserSessions(): boolean {
    return this.graph.waitingForUserSessionsCount > 0;
  }
}

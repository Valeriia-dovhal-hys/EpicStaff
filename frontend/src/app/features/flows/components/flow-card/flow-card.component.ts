import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { GraphDto } from '../../models/graph.model';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { IconButtonComponent } from '../../../../shared/components/buttons/icon-button/icon-button.component';

export interface FlowCardAction {
  action: 'viewSessions' | 'delete' | 'open'; // Added 'open' back
  flow: GraphDto;
}

@Component({
  selector: 'app-flow-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconButtonComponent], // Added button components
  templateUrl: './flow-card.component.html',
  styleUrls: ['./flow-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowCardComponent {
  @Input({ required: true }) flow!: GraphDto;

  @Output() cardClick = new EventEmitter<GraphDto>(); // This will signify opening/editing the flow
  @Output() action = new EventEmitter<FlowCardAction>();

  // private router = inject(Router); // Router not needed if parent handles navigation

  onCardClick(): void {
    this.cardClick.emit(this.flow);
  }

  onViewSessions(event: MouseEvent): void {
    event.stopPropagation(); // Prevent card click
    this.action.emit({ action: 'viewSessions', flow: this.flow });
  }

  onDelete(event?: MouseEvent | void): void {
    if (event && typeof event === 'object' && 'stopPropagation' in event) {
      event.stopPropagation(); // Prevent card click only if it's a MouseEvent
    }
    this.action.emit({ action: 'delete', flow: this.flow });
  }

  // onEdit method removed
}

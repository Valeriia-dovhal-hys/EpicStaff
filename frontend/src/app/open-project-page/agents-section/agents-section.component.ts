// agents-section.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  Renderer2,
  NgZone,
  ApplicationRef,
  Output,
  EventEmitter,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Make sure to add Tabler Icons to your project
// You can add it to your angular.json or include the CDN in your index.html
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.30.0/tabler-icons.min.css">;

import { Subscription } from 'rxjs';
import { ProjectStateService } from '../services/project-state.service';
import { FullAgent } from '../../services/full-agent.service';
import {
  GridControlsComponent,
  GridSizeOption,
} from './grid-controls/grid-controls.component';
import {
  trigger,
  style,
  transition,
  animate,
  AnimationEvent,
} from '@angular/animations';
import {
  CardState,
  StaffAgentCardComponent,
} from './grid-controls/dropdown-staff-agents/staff-agent-card/staff-agent-card.component';

@Component({
  selector: 'app-agents-section',
  templateUrl: './agents-section.component.html',
  styleUrls: ['./agents-section.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    GridControlsComponent,
    StaffAgentCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsSectionComponent implements OnInit, OnDestroy {
  public agents: FullAgent[] = [];
  public currentGridSize: GridSizeOption = 'medium';

  @HostBinding('class.size-small') get isSmallSize() {
    return this.currentGridSize === 'small';
  }
  @HostBinding('class.size-medium') get isMediumSize() {
    return this.currentGridSize === 'medium';
  }
  @HostBinding('class.size-large') get isLargeSize() {
    return this.currentGridSize === 'large';
  }

  public cardState: CardState = 'default';

  private agentsSubscription!: Subscription;
  public isLoaded: boolean = false;
  constructor(
    private projectStateService: ProjectStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.agentsSubscription = this.projectStateService.agents$.subscribe({
      next: (agents: FullAgent[]) => {
        this.agents = agents;
        this.isLoaded = true;
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.agentsSubscription) {
      this.agentsSubscription.unsubscribe();
    }
  }

  onGridSizeChanged(size: GridSizeOption): void {
    this.currentGridSize = size;

    this.cdr.markForCheck();
  }
  public onShowDropdownChange(isDropdownVisible: boolean): void {
    this.cardState = isDropdownVisible ? 'removing' : 'default';
    this.cdr.markForCheck();
  }
  public onRemoveStaffAgent(staffAgent: FullAgent) {
    this.projectStateService.removeAgent(staffAgent);
  }

  public trackAgentById(index: number, staffAgent: FullAgent): string | number {
    return staffAgent.id;
  }
}

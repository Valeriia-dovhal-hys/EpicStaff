import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  Output,
  EventEmitter,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { FullAgent } from '../../../../../services/full-agent.service';
import { AgentMenuComponent } from './header-sub-menu/header-sub-menu.component';

export type CardState = 'default' | 'adding' | 'removing';

interface SectionStates {
  goal: boolean;
  backstory: boolean;
  details: boolean;
}

@Component({
  selector: 'app-staff-agent-card',
  standalone: true,
  imports: [CommonModule, AgentMenuComponent],
  templateUrl: './staff-agent-card.component.html',
  styleUrls: ['./staff-agent-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          opacity: '0',
        })
      ),
      state(
        'expanded',
        style({
          opacity: '1',
        })
      ),
      transition('collapsed <=> expanded', [animate('300ms ease')]),
    ]),
  ],
})
export class StaffAgentCardComponent implements OnInit {
  @HostBinding('attr.size') @Input() size: 'small' | 'medium' | 'large' =
    'medium';
  @Input() agent!: FullAgent;
  @Input() cardState: CardState = 'default';

  @Output() public addAgent = new EventEmitter<FullAgent>();
  @Output() public showAdvancedSettings = new EventEmitter<void>();
  @Output() public addToFavorites = new EventEmitter<void>();
  @Output() public removeAgent = new EventEmitter<FullAgent>();

  public goalExpanded = false;
  public backstoryExpanded = false;
  public toolsExpanded = false;
  public tagsExpanded = false;
  public isMenuOpen = false;

  // Default state for sections (all collapsed)
  public sectionStates: SectionStates = {
    goal: false,
    backstory: false,
    details: false,
  };

  // Store the emoji so it doesn't change on re-renders
  private agentEmoji = '';

  ngOnInit(): void {
    // Initialize the agent's emoji once
    this.initializeAgentEmoji();

    // Initially collapse all sections
    this.sectionStates.goal = false;
    this.sectionStates.backstory = false;
    this.sectionStates.details = false;
  }

  public onAddAgentClick(): void {
    this.addAgent.emit(this.agent);
  }

  public onRemoveAgentClick(): void {
    console.log('Remove agent clicked:', this.agent.role);
    this.removeAgent.emit(this.agent);
  }

  public toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu(): void {
    this.isMenuOpen = false;
  }

  public onAdvancedSettings(): void {
    this.showAdvancedSettings.emit();
  }

  public onAddToFavorites(): void {
    this.addToFavorites.emit();
  }

  public onRemoveFromMenu(): void {
    console.log('Remove agent from menu clicked:', this.agent.role);
    this.removeAgent.emit(this.agent);
    this.closeMenu();
  }

  /**
   * Toggle the expanded/collapsed state of a section
   */
  public toggleSection(section: keyof SectionStates): void {
    // Toggle the section's expanded state
    this.sectionStates[section] = !this.sectionStates[section];
  }

  private initializeAgentEmoji(): void {
    const emojis = [
      '💻',
      '⚙️',
      '🔌',
      '🖥️',
      '📱',
      '🤖',
      '📡',
      '💰',
      '💹',
      '📊',
      '📈',
      '💸',
      '🏦',
      '💲',
      '🔬',
      '🧪',
      '📝',
      '🔍',
      '🧠',
      '📚',
      '🧮',
      '🎓',
      '✏️',
      '🧑‍🏫',
      '🔤',
      '📖',
      '📣',
      '📢',
      '🎯',
      '💬',
      '🔮',
      '🧩',
      '🚀',
      '💡',
      '✨',
      '🔧',
      '📌',
      '🔔',
      '🎨',
      '🎭',
      '🏆',
      '🌟',
      '🔥',
      '⭐',
      '💫',
      '🌈',
      '🌞',
      '🌱',
      '🌿',
      '🍀',
    ];

    // Use the agent's ID or role to create a deterministic index
    let seed = 0;
    if (this.agent.id) {
      // Convert ID to a number for seeding
      seed =
        typeof this.agent.id === 'number'
          ? this.agent.id
          : this.hashString(String(this.agent.id));
    } else if (this.agent.role) {
      // Use the role string if no ID is available
      seed = this.hashString(this.agent.role);
    }

    // Get a deterministic index based on the agent's properties
    const index = Math.abs(seed) % emojis.length;
    this.agentEmoji = emojis[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  public getAgentEmoji(): string {
    return this.agentEmoji;
  }

  public isTextTruncated(text?: string): boolean {
    return typeof text === 'string' && text.length > 200;
  }

  public getDisplayedTools(): { id: number; name: string; type: string }[] {
    if (!this.agent.mergedTools || this.agent.mergedTools.length === 0) {
      return [];
    }

    if (this.toolsExpanded || this.agent.mergedTools.length <= 4) {
      return this.agent.mergedTools;
    } else {
      return this.agent.mergedTools.slice(0, 4);
    }
  }

  public getDisplayedTags(): string[] {
    if (!this.agent.tags || this.agent.tags.length === 0) {
      return [];
    }

    if (this.tagsExpanded || this.agent.tags.length <= 6) {
      return this.agent.tags;
    } else {
      return this.agent.tags.slice(0, 6);
    }
  }

  public shouldShowToolsToggle(): boolean {
    return !!this.agent.mergedTools && this.agent.mergedTools.length > 4;
  }

  public shouldShowTagsToggle(): boolean {
    return !!this.agent.tags && this.agent.tags.length > 6;
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgFor, NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [NgFor, NgIf, MatIconModule],
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Fade animation for icon picker
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-4px)' }),
        animate(
          '200ms ease',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease',
          style({ opacity: 0, transform: 'translateY(-4px)' })
        ),
      ]),
    ]),
  ],
})
export class IconPickerComponent implements OnInit {
  @Input() selectedIcon: string | null = null;
  @Output() iconSelected = new EventEmitter<string | null>();

  public showIconPicker = false;
  public selectedCategory = 'emoji';

  public iconCategories = [
    { name: 'emoji', icon: 'emoji_emotions' },
    { name: 'work', icon: 'work' },
    { name: 'tech', icon: 'devices' },
    { name: 'nature', icon: 'nature' },
    { name: 'common', icon: 'star' },
    { name: 'animals', icon: 'pets' },
    { name: 'food', icon: 'fastfood' },
  ];

  public icons = {
    emoji: [
      '😀',
      '😎',
      '🚀',
      '💡',
      '⚡',
      '🔥',
      '💻',
      '📊',
      '📈',
      '🤖',
      '🧠',
      '📝',
      '🔍',
      '🏆',
      '⭐',
      '💬',
      '📚',
      '🧩',
      '🎯',
      '🌟',
      '💪',
      '😂',
      '😍',
      '🤔',
      '🙌',
      '😢',
      '😡',
      '🥳',
      '😇',
      '🤩',
    ],
    work: [
      'work',
      'business',
      'assignment',
      'description',
      'grading',
      'note_alt',
      'task',
      'checklist',
      'fact_check',
      'ballot',
    ],
    tech: [
      'devices',
      'computer',
      'smartphone',
      'memory',
      'developer_board',
      'code',
      'terminal',
      'smart_toy',
      'api',
      'data_object',
    ],
    nature: [
      'nature',
      'eco',
      'air',
      'grass',
      'water',
      'tornado',
      'bolt',
      'waves',
      'foggy',
      'forest',
    ],
    common: [
      'star',
      'favorite',
      'bookmark',
      'flag',
      'label',
      'category',
      'folder',
      'palette',
      'format_paint',
      'design_services',
    ],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
    food: ['🍎', '🍕', '🍔', '🍟', '🍣', '🍩', '🍪', '🍰', '🥗', '🍜'],
  };

  constructor() {}

  ngOnInit(): void {}

  get filteredIcons(): string[] {
    return this.icons[this.selectedCategory as keyof typeof this.icons] || [];
  }

  toggleIconPicker(): void {
    this.showIconPicker = !this.showIconPicker;
    if (this.showIconPicker) {
      setTimeout(() => {
        document.addEventListener('click', this.closeIconPickerOnClickOutside);
      });
    } else {
      document.removeEventListener('click', this.closeIconPickerOnClickOutside);
    }
  }

  closeIconPickerOnClickOutside = (event: Event) => {
    const iconPicker = document.querySelector('.icon-picker-popup');
    const iconButton = document.querySelector('.icon-selector');
    if (
      iconPicker &&
      !iconPicker.contains(event.target as Node) &&
      iconButton &&
      !iconButton.contains(event.target as Node)
    ) {
      this.showIconPicker = false;
      document.removeEventListener('click', this.closeIconPickerOnClickOutside);
    }
  };

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.iconSelected.emit(icon);
    this.showIconPicker = false;
  }

  clearIcon(): void {
    this.selectedIcon = null;
    this.iconSelected.emit(null);
  }

  isEmoji(str: string): boolean {
    return /\p{Emoji}/u.test(str);
  }
}

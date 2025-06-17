import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-header.component.html',
  styleUrl: './group-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupHeaderComponent implements AfterViewInit {
  // Keep inputs as regular properties
  @Input() groupName: string = '';
  @Input() isCollapsed: boolean = false;
  @Input() hasParent: boolean = false;
  @Input() isParentHovered: boolean = false;

  // Keep outputs as EventEmitters
  @Output() headerRenamed = new EventEmitter<string>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  @Output() ungroup = new EventEmitter<void>();

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  // Convert internal state to signals
  isRenaming = signal(false);
  isToggleDisabled = signal(false);

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (this.isRenaming() && this.nameInput) {
      this.focusInput();
    }
  }

  focusInput(): void {
    if (this.nameInput && this.nameInput.nativeElement) {
      this.nameInput.nativeElement.focus();
      this.nameInput.nativeElement.select();
    }
  }

  startRename(event: Event): void {
    event.stopPropagation();
    this.isRenaming.set(!this.isRenaming());
    if (this.isRenaming()) {
      setTimeout(() => this.focusInput(), 0);
    }
  }

  saveNewName(newName: string): void {
    if (newName && newName.trim() !== '') {
      this.headerRenamed.emit(newName.trim());
    }
    this.isRenaming.set(false);
  }

  cancelRename(): void {
    this.isRenaming.set(false);
  }

  onToggleCollapsed(event: Event): void {
    event.stopPropagation();

    // If the button is disabled, don't do anything
    if (this.isToggleDisabled()) {
      return;
    }

    // Disable the button
    this.isToggleDisabled.set(true);

    // Emit the event
    this.toggleCollapsed.emit();

    // Re-enable the button after 300ms
    setTimeout(() => {
      this.isToggleDisabled.set(false);
      // Since we're using OnPush change detection, we need to manually trigger change detection
      this.cdr.markForCheck();
    }, 500);
  }

  onUngroup(event: Event): void {
    event.stopPropagation();
    this.ungroup.emit();
  }
}

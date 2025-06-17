import {
  Directive,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  NgZone,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';

@Directive({
  selector: '[appShortcutListener]',
  standalone: true,
})
export class ShortcutListenerDirective implements OnInit, OnDestroy {
  @Output() copy = new EventEmitter<void>();
  @Output() paste = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();

  private subscription!: Subscription;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Listen for keydown events on the window
    this.ngZone.runOutsideAngular(() => {
      this.subscription = fromEvent<KeyboardEvent>(window, 'keydown').subscribe(
        (event) => this.handleKeydown(event)
      );
    });
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Prevent handling shortcuts when focus is on an interactive element.
    const target = event.target as HTMLElement;
    if (target.matches('input, textarea, select, [contenteditable]')) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey } = event;

    // Always handle Delete/Backspace regardless of modifiers.
    if (key === 'Delete' || key === 'Backspace') {
      this.delete.emit();
      return;
    }

    // Only process other shortcuts if a modifier is pressed.
    if (!(ctrlKey || metaKey)) {
      return;
    }

    if (key === 'c') {
      this.copy.emit();
    } else if (key === 'v') {
      this.paste.emit();
    } else if (key === 'z' && !shiftKey) {
      this.undo.emit();
    } else if (
      (key.toLowerCase() === 'z' && shiftKey) ||
      key.toLowerCase() === 'y'
    ) {
      this.redo.emit();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

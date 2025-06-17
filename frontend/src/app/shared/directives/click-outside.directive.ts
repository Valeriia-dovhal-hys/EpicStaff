import {
  Directive,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnDestroy {
  @Output() clickOutside = new EventEmitter<Event>();
  private removeClickListener: (() => void) | null = null;

  constructor(
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private renderer: Renderer2
  ) {
    // Run listener registration outside Angular for performance
    this.ngZone.runOutsideAngular(() => {
      this.removeClickListener = this.renderer.listen(
        'document',
        'click',
        (event: Event) => {
          // Check if the clicked element is not contained within the host element
          if (!this.elementRef.nativeElement.contains(event.target)) {
            // Reenter Angular zone before emitting
            this.ngZone.run(() => this.clickOutside.emit(event));
          }
        }
      );
    });
  }

  ngOnDestroy() {
    if (this.removeClickListener) {
      this.removeClickListener();
      this.removeClickListener = null;
    }
  }
}

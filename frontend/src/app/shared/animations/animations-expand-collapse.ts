import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

// Improved animations that work properly with content visibility
export const expandCollapseAnimation = trigger('expandCollapse', [
  state(
    'collapsed',
    style({
      maxHeight: '0',
      opacity: '0',
      visibility: 'hidden',
      overflow: 'hidden',
    })
  ),
  state(
    'expanded',
    style({
      maxHeight: '1000px', // Set to a value larger than expected content
      opacity: '1',
      visibility: 'visible',
      overflow: 'visible',
    })
  ),
  transition('expanded <=> collapsed', [animate('180ms ease-in-out')]),
]);

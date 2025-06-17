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
      height: '0',
      opacity: '0',
      visibility: 'hidden',
    })
  ),
  state(
    'expanded',
    style({
      height: '*',
      opacity: '1',
      visibility: 'visible',
    })
  ),
  transition('expanded => collapsed', [
    animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
  ]),
  transition('collapsed => expanded', [
    animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
  ]),
]);

import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from '@angular/core';

interface Variable {
  title: string;
  value: string;
}

interface PopupConfig {
  variables?: Variable[];
  position: { top: number; left: number };
  show: boolean;
}

@Component({
  selector: 'app-variable-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
})
export class VariablePopupComponent {
  @Input() config!: PopupConfig;
  @Output() variableSelected = new EventEmitter<string>();
  @ViewChild('popupElement') popupElement!: ElementRef<HTMLDivElement>;

  onVariableClick(variableTitle: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.variableSelected.emit(variableTitle);
  }

  preventEventPropagation(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }
}

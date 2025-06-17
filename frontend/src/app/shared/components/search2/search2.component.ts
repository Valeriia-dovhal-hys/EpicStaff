import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export type SearchSize = 'default' | 'compact';

@Component({
  selector: 'app-search2',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search2.component.html',
  styleUrls: ['./search2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search2Component {
  @Input() placeholder: string = 'Search...';
  @Input() value: string = '';
  @Input() size: SearchSize = 'default';
  @Input() customClass: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.value = inputValue;
    this.valueChange.emit(inputValue);
  }

  get inputClasses(): string {
    return `search-input ${
      this.size === 'compact' ? 'search-input-compact' : ''
    } ${this.customClass}`;
  }
}

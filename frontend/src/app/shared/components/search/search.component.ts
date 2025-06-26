import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { ButtonComponent } from '../buttons/button/button.component';
import { SearchShortcutDirective } from '../../directives/search-shortcut.directive';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, AppIconComponent, SearchShortcutDirective],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnChanges {
  @Input() public value: string = '';
  @Input() public placeholder: string = 'Search...';
  @Input() public icon: string = 'ui/search';
  @Input() public width: string = '20rem';
  @Input() public ariaLabel: string = 'Search';
  @Output() public valueChange = new EventEmitter<string>();

  private internalValue: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    // Update internal value when external value changes
    if (changes['value'] && changes['value'].currentValue !== undefined) {
      this.internalValue = changes['value'].currentValue;
    }
  }

  public onInput(value: string): void {
    const trimmedValue = value.trim();

    // Only emit if the value has actually changed
    if (trimmedValue !== this.internalValue) {
      this.internalValue = trimmedValue;
      this.valueChange.emit(trimmedValue);
    }
  }

  public clear(): void {
    this.internalValue = '';
    this.valueChange.emit('');
  }
}

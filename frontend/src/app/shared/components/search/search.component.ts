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
  imports: [
    CommonModule,
    AppIconComponent,
    ButtonComponent,
    SearchShortcutDirective,
  ],
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

  private isBlurred: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Reset blur flag when value changes from parent
    if (changes['value']) {
      this.isBlurred = false;
    }
  }

  public onBlur(): void {
    this.isBlurred = true;
  }

  public onInput(value: string): void {
    const trimmedValue = value.trim();

    // Delay execution to check if blur occurred (Telerik forum solution)
    setTimeout(() => {
      if (this.isBlurred) {
        // Reset blur flag and skip emission
        this.isBlurred = false;
        return;
      }

      // Emit the trimmed value
      this.valueChange.emit(trimmedValue);
    }, 10);
  }

  public clear(): void {
    this.valueChange.emit('');
  }
}

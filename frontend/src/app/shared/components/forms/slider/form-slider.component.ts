import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-slider.component.html',
  styleUrls: ['./form-slider.component.scss'],
})
export class FormSliderComponent implements OnChanges {
  @Input() value: number = 50;
  @Input() label: string = '';
  @Input() min: number = 0;
  @Input() max: number = 100;

  @Output() valueChange = new EventEmitter<number>();

  valuePosition: string = '50%';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['min'] || changes['max']) {
      this.updateValuePosition();
    }
  }

  onSliderInput(event: Event): void {
    const newValue = Number((event.target as HTMLInputElement).value);
    this.value = newValue;
    this.updateValuePosition();
    this.valueChange.emit(newValue);
  }

  private updateValuePosition(): void {
    const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
    this.valuePosition = `${percentage}%`;
  }
}

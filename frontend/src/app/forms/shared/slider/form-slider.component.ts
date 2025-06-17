import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-slider.component.html',
  styleUrls: ['./form-slider.component.scss'],
})
export class FormSliderComponent {
  @Input() value: number = 50;
  @Input() label: string = 'Manager Creativity Level:';
  @Input() min: number = 0;
  @Input() max: number = 100;

  @Output() valueChange = new EventEmitter<number>();

  onSliderInput(event: Event): void {
    const newValue = Number((event.target as HTMLInputElement).value);
    this.valueChange.emit(newValue);
  }
}

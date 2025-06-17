import {
  Component,
  Input,
  forwardRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { FullEmbeddingConfig } from '../../../../../services/full-embedding.service';

@Component({
  selector: 'app-embedding-selector',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  template: `
    <div
      class="dropdown-container"
      [class.disabled]="disabled"
      clickOutside
      (clickOutside)="isOpen = false"
    >
      <div
        class="selected-option"
        (click)="toggleDropdown()"
        [class.open]="isOpen"
      >
        <span *ngIf="!selectedConfig" class="placeholder">{{
          placeholder
        }}</span>
        <span *ngIf="selectedConfig" class="selected-text">
          <span class="model-name">{{
            selectedConfig.modelDetails?.name || 'Unknown Model'
          }}</span>
          <span class="config-name">{{ selectedConfig.custom_name }}</span>
        </span>
        <i class="ti ti-chevron-down"></i>
      </div>

      <div class="dropdown-list" *ngIf="isOpen">
        <div
          *ngFor="let config of embeddingConfigs"
          class="dropdown-item"
          (click)="selectOption(config)"
          [class.selected]="config.id === value"
        >
          <span class="model-name">{{
            config.modelDetails?.name || 'Unknown Model'
          }}</span>
          <span class="config-name">{{ config.custom_name }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dropdown-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmbeddingSelectorComponent),
      multi: true,
    },
  ],
})
export class EmbeddingSelectorComponent implements ControlValueAccessor {
  @Input() embeddingConfigs: FullEmbeddingConfig[] = [];
  @Input() placeholder = 'Select embedding model';
  @Input() disabled = false;

  isOpen = false;
  value: number | null = null;
  onChange = (_: any) => {};
  onTouched = () => {};

  get selectedConfig(): FullEmbeddingConfig | undefined {
    return this.embeddingConfigs.find((config) => config.id === this.value);
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      this.onTouched();
    }
  }

  selectOption(config: FullEmbeddingConfig): void {
    this.value = config.id;
    this.isOpen = false;
    this.onChange(this.value);
    this.onTouched();
  }

  writeValue(value: number): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

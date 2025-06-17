import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-models-header',
    templateUrl: './models-header.component.html',
    styleUrls: ['./models-header.component.scss'],
    imports: [MatIconModule]
})
export class ModelsHeaderComponent {
  @Input() modelCount: number = 0;
  @Input() searchTerm: string = '';

  @Output() searchInput = new EventEmitter<string>();
  @Output() openCustomModel = new EventEmitter<void>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.emit(value);
  }

  openCustomModelDialog(): void {
    this.openCustomModel.emit();
  }
}

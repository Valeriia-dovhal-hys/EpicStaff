import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-tools-header',
    templateUrl: './tools-header.component.html',
    styleUrls: ['./tools-header.component.scss'],
    imports: [MatIconModule]
})
export class ToolsHeaderComponent {
  @Input() toolCount: number = 0;
  @Input() searchTerm: string = '';

  @Output() searchInput = new EventEmitter<string>();

  @Output() openCustomTool = new EventEmitter<void>();

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.emit(value);
  }

  openCustomToolDialog() {
    this.openCustomTool.emit();
  }
}

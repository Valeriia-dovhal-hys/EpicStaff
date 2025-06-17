import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { GetSourceCollectionRequest } from '../../../../knowledge-sources/models/source-collection.model';

@Component({
  selector: 'app-knowledge-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClickOutsideDirective,
  ],
  templateUrl: './knowledge-selector.component.html',
  styleUrls: ['./knowledge-selector.component.scss'],
})
export class KnowledgeSelectorComponent {
  @Input() selectedCollectionId: number | null = null;
  @Input() collections: GetSourceCollectionRequest[] = [];
  @Input() label: string = 'Knowledge Source';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Output() collectionChange = new EventEmitter<number | null>();

  isOpen = false;

  toggleDropdown(): void {
    if (!this.disabled && !this.loading) {
      this.isOpen = !this.isOpen;
    }
  }

  selectCollection(collectionId: number | null): void {
    this.selectedCollectionId = collectionId;
    this.collectionChange.emit(collectionId);
    this.isOpen = false;
  }

  getSelectedCollectionName(): string {
    if (this.loading) {
      return 'Loading collections...';
    }

    if (this.selectedCollectionId === null) {
      return 'No knowledge source';
    }

    const selected = this.collections.find(
      (collection) => collection.collection_id === this.selectedCollectionId
    );
    return selected ? selected.collection_name : 'Select a knowledge source';
  }
}

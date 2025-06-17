// new-project-card.component.ts
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-new-project-card',
  standalone: true,
  templateUrl: './new-project-card.component.html',
  styleUrls: ['./new-project-card.component.scss'],
})
export class NewProjectCardComponent {
  @Output() createProject = new EventEmitter<void>();

  onCreateProject(): void {
    this.createProject.emit();
  }
}

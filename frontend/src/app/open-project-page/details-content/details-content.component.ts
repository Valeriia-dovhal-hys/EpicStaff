import { NgFor } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ProjectsService } from '../../pages/projects-page/services/projects.service';

@Component({
  selector: 'app-details-content',
  templateUrl: './details-content.component.html',
  styleUrls: ['./details-content.component.scss'],
  standalone: true,
  imports: [FormsModule, NgFor],
})
export class DetailsContentComponent implements OnInit, OnChanges {
  @Input() public description!: string;
  @Input() public tags: string[] = [];
  @Input() public projectId!: number;
  @Output() public tagsUpdated: EventEmitter<string[]> = new EventEmitter<
    string[]
  >();

  public internalDescription: string = '';
  public internalTags: string[] = [];
  public newTag: string = '';
  public duplicateTagName: string | null = null;
  public isEditingDescription: boolean = false;

  private readonly descriptionSubject: Subject<string> = new Subject();
  private readonly tagsSubject: Subject<string[]> = new Subject();

  constructor(private readonly projectsService: ProjectsService) {}

  public ngOnInit(): void {
    this.internalDescription = this.description || '';
    this.internalTags = [...this.tags];

    // Subscribe to the subject and update via service after debounce
    this.descriptionSubject
      .pipe(debounceTime(500))
      .subscribe((updatedDescription: string) => {
        if (updatedDescription !== this.description) {
          this.updateProjectDescription(updatedDescription);
        }
      });

    // Subscribe to tags changes with debounce
    this.tagsSubject
      .pipe(debounceTime(300))
      .subscribe((updatedTags: string[]) => {
        this.tagsUpdated.emit(updatedTags);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['tags']) {
      this.internalTags = [...this.tags];
    }
    if (changes['description']) {
      this.internalDescription = this.description || '';
    }
  }

  public onAddTag(): void {
    let trimmedTag = this.newTag.trim();

    // Remove hashtag if user manually added it
    if (trimmedTag.startsWith('#')) {
      trimmedTag = trimmedTag.substring(1);
    }

    if (trimmedTag) {
      // Format tag to match existing format (e.g., capitalize first letter)
      const formattedTag =
        trimmedTag.charAt(0).toUpperCase() + trimmedTag.slice(1);

      // Check for exact duplicate
      const duplicate = this.internalTags.find(
        (tag) => tag.toLowerCase() === formattedTag.toLowerCase()
      );

      if (duplicate) {
        this.duplicateTagName = duplicate;
        setTimeout(() => {
          this.duplicateTagName = null;
        }, 820); // Animation duration + small buffer
      } else {
        this.duplicateTagName = null;
        this.internalTags = [...this.internalTags, formattedTag];
        this.newTag = '';
        this.tagsSubject.next(this.internalTags);
      }
    }
  }

  public onRemoveTag(tag: string): void {
    this.internalTags = this.internalTags.filter((t) => t !== tag);
    this.tagsSubject.next(this.internalTags);
  }

  public onFocusDescription(): void {
    this.isEditingDescription = true;
  }

  public onBlurDescription(): void {
    this.isEditingDescription = false;
    // Emit the value to the subject to trigger debounce
    this.descriptionSubject.next(this.internalDescription);
  }

  public getTextareaRows(text: string): number {
    if (!text) return 2;
    const lineCount = text.split('\n').length;
    return Math.min(Math.max(lineCount, 2), 4);
  }

  // Adjust textarea height based on content
  public adjustTextareaHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 160); // Max height 160px
    textarea.style.height = `${newHeight}px`;
  }

  // Private method to update project description via API
  private updateProjectDescription(description: string): void {
    if (!this.projectId) {
      console.error('Project ID is required for updating description');
      return;
    }
    this.projectsService
      .updateProjectField(this.projectId, description)
      .subscribe({
        next: (response) => {
          console.log('Description updated successfully', response);
        },
        error: (error) => {
          console.error('Error updating description:', error);
          // Optionally revert to original description on error
          this.internalDescription = this.description || '';
        },
      });
  }
}

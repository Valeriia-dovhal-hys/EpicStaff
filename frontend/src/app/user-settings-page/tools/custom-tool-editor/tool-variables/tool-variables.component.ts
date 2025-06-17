import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ArgsSchema } from '../../../../features/tools/models/python-code-tool.model';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-tool-variables',
  templateUrl: './tool-variables.component.html',
  styleUrls: ['./tool-variables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, AppIconComponent],
})
export class ToolVariablesComponent implements OnInit, AfterViewInit {
  /** Holds the list of variables; each row is an object with name and description. */
  @Input() public argShema?: ArgsSchema;

  /** References to all name input elements */
  @ViewChildren('nameInput') nameInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  public variables: Array<{ name: string; description: string }> = [];

  /** Tracks which input should receive focus after view update */
  private focusIndex: number | null = null;

  public constructor(private cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    // If an args schema is provided, parse its properties to build the variables array.
    if (this.argShema?.properties) {
      this.variables = Object.keys(this.argShema.properties).map((key) => ({
        name: key,
        description: this.argShema!.properties[key].description || '',
      }));
    }

    // Always ensure there is at least one variable row.
    if (this.variables.length === 0) {
      this.variables.push({ name: '', description: '' });
    }

    // Mark for check to update the view under OnPush change detection.
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    // Subscribe to changes in the nameInputs QueryList
    this.nameInputs.changes.subscribe(() => {
      this.focusNameInputIfNeeded();
    });
  }

  /**
   * Adds a new, empty variable to the list.
   */
  public onAddVariable(): void {
    this.variables.push({ name: '', description: '' });
    this.focusIndex = this.variables.length - 1;
    this.cdr.markForCheck();
  }

  /**
   * Removes the variable at the given index.
   * If there's only one row, just clear it instead of removing it completely.
   */
  public removeVariable(index: number): void {
    if (this.variables.length === 1) {
      this.variables[0] = { name: '', description: '' };
    } else {
      this.variables.splice(index, 1);
    }
    this.cdr.markForCheck();
  }

  /**
   * Called when the user presses Enter in an input.
   * Creates a new variable entry after the current one and focuses it.
   */
  public onKeyUpEnter(index: number): void {
    // Create a copy of the current variables array
    const updatedVariables = [...this.variables];

    // Insert a new empty variable after the current index
    updatedVariables.splice(index + 1, 0, { name: '', description: '' });

    // Replace the variables array with the updated one
    this.variables = updatedVariables;

    // Set the index to focus after view update
    this.focusIndex = index + 1;

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Focuses the name input at the stored focusIndex if it exists
   */
  private focusNameInputIfNeeded(): void {
    if (this.focusIndex !== null && this.nameInputs) {
      const inputsArray = this.nameInputs.toArray();
      const indexToFocus = this.focusIndex; // Create a non-null local variable

      if (indexToFocus >= 0 && indexToFocus < inputsArray.length) {
        // Use setTimeout to ensure this happens after Angular's change detection
        setTimeout(() => {
          const element = inputsArray[indexToFocus]?.nativeElement;
          if (element) {
            element.focus();
          }
          this.focusIndex = null;
        }, 0);
      }
    }
  }
}

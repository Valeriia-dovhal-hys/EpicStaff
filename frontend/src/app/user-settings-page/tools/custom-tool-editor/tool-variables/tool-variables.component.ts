import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ArgsSchema } from '../models/python-code-tool.model';

@Component({
    selector: 'app-tool-variables',
    templateUrl: './tool-variables.component.html',
    styleUrls: ['./tool-variables.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, NgFor, NgIf]
})
export class ToolVariablesComponent implements OnInit {
  /** Holds the list of variables; each row is an object with name and description. */
  @Input() public argShema?: ArgsSchema;

  public variables: Array<{ name: string; description: string }> = [];
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

  /**
   * Adds a new, empty variable to the list.
   */
  public onAddVariable(): void {
    this.variables.push({ name: '', description: '' });
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
   * Called when the user presses Enter in the description input.
   * If you only want to add a new row when the user presses Enter on the "last" row,
   * you can add a check for `i === variables.length - 1`.
   */
  public onKeyUpEnter(i: number): void {
    // E.g. only add if user is on the *last* row:
    if (i === this.variables.length - 1) {
      this.onAddVariable();
    }

    // Or add a new line unconditionally:
    // this.onAddVariable();
  }
}

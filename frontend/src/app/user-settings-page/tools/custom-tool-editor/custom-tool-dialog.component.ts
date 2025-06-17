import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

// Child components and services
import { ToolVariablesComponent } from './tool-variables/tool-variables.component';
import { ToolLibrariesComponent } from './tool-libraries/tool-libraries.component';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { PythonCodeToolService } from './services/pythonCodeToolService.service';

// Models
import {
  ArgsSchema,
  CreatePythonCodeToolRequest,
  UpdatePythonCodeToolRequest,
} from './models/python-code-tool.model';
import { PythonCodeToolCard } from '../models/pythonTool-card.model';

// **Import** the utility function
import { buildArgsSchema } from './arg-shema-builder/build-args-schema.util';

interface DialogData {
  pythonTools: PythonCodeToolCard[];
  selectedTool?: PythonCodeToolCard;
}

@Component({
  selector: 'app-custom-tool-dialog',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ToolVariablesComponent,
    ToolLibrariesComponent,
    CodeEditorComponent,
  ],
  templateUrl: './custom-tool-dialog.component.html',
  styleUrls: ['./custom-tool-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomToolDialogComponent implements OnInit, AfterViewInit {
  @ViewChild(ToolVariablesComponent)
  toolVariablesComponent!: ToolVariablesComponent;
  @ViewChild(ToolLibrariesComponent)
  toolLibrariesComponent!: ToolLibrariesComponent;
  @ViewChild(CodeEditorComponent)
  toolEditorComponent!: CodeEditorComponent;
  @ViewChild('toolNameInput')
  toolNameInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  public pythonCode: string =
    'def main(arg1: str, arg2: str) -> dict:\n    return {\n        "result": arg1 + arg2,\n    }\n';
  public editorHasError = false;
  public selectedVariables: Array<{ name: string; description: string }> = [];
  public selectedLibraries: string[] = [];
  public selectedTool?: PythonCodeToolCard;

  constructor(
    private dialogRef: DialogRef<any>,
    private cdr: ChangeDetectorRef,
    private pythonCodeToolService: PythonCodeToolService,
    @Inject(DIALOG_DATA) public data: DialogData
  ) {
    if (data.selectedTool) {
      this.selectedTool = data.selectedTool;
    }
  }

  ngOnInit(): void {
    // Initialize form
    this.form = new FormGroup({
      toolName: new FormControl(
        this.selectedTool ? this.selectedTool.name : '',
        [Validators.required, this.uniqueNameValidator.bind(this)]
      ),
      toolDescription: new FormControl(
        this.selectedTool ? this.selectedTool.description : '',
        Validators.required
      ),
    });

    // Populate if selectedTool is present
    if (this.selectedTool) {
      this.pythonCode = this.selectedTool.python_code.code;
      this.selectedLibraries = this.selectedTool.python_code.libraries || [];

      if (
        this.selectedTool.args_schema &&
        this.selectedTool.args_schema.properties
      ) {
        this.selectedVariables = Object.entries(
          this.selectedTool.args_schema.properties
        ).map(([name, prop]: [string, any]) => ({
          name,
          description: prop.description || '',
        }));
      }
    }

    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    // Optionally focus the name input
    setTimeout(() => {
      this.toolNameInput?.nativeElement.focus();
    });
  }

  uniqueNameValidator(control: AbstractControl): ValidationErrors | null {
    const name = (control.value || '').trim().toLowerCase();
    if (!name) {
      return null;
    }
    const duplicateExists = this.data.pythonTools.some(
      (tool) =>
        tool.name.toLowerCase() === name &&
        (!this.selectedTool || tool.id !== this.selectedTool.id)
    );
    return duplicateExists ? { nonUniqueName: true } : null;
  }

  public close(): void {
    this.dialogRef.close();
  }

  public createTool(): void {
    // Validate form
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const toolName = this.form.value.toolName;
    const toolDescription = this.form.value.toolDescription;

    // Use the imported utility to build the ArgsSchema
    const argsSchemaObj: ArgsSchema = buildArgsSchema(
      this.toolEditorComponent.pythonCode,
      // Use variables from the variables component if available; otherwise, fallback
      this.toolVariablesComponent?.variables?.length
        ? this.toolVariablesComponent.variables
        : this.selectedVariables
    );

    // Prepare request data
    const toolData: CreatePythonCodeToolRequest = {
      python_code: {
        libraries: this.toolLibrariesComponent?.libraries?.length
          ? this.toolLibrariesComponent.libraries
          : this.selectedLibraries,
        code: this.toolEditorComponent.pythonCode,
        entrypoint: 'main',
      },
      name: toolName,
      description: toolDescription,
      args_schema: argsSchemaObj,
    };

    if (this.selectedTool) {
      // Update scenario
      const updateTool: UpdatePythonCodeToolRequest = {
        id: this.selectedTool.id,
        python_code: {
          id: this.selectedTool.python_code.id,
          libraries: this.toolLibrariesComponent?.libraries?.length
            ? this.toolLibrariesComponent.libraries
            : this.selectedLibraries,
          code: this.toolEditorComponent.pythonCode,
          entrypoint: 'main',
        },
        name: toolName,
        description: toolDescription,
        args_schema: argsSchemaObj,
      };
      this.pythonCodeToolService
        .updatePythonCodeTool(String(this.selectedTool.id), updateTool)
        .subscribe({
          next: (result: any) => {
            console.log('Tool updated successfully:', result);
            this.dialogRef.close(result);
          },
          error: (error) => {
            console.error('Error updating tool:', error);
          },
        });
    } else {
      // Create scenario
      this.pythonCodeToolService.createPythonCodeTool(toolData).subscribe({
        next: (result: any) => {
          console.log('Tool created successfully in dialog:', result);
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error creating tool:', error);
        },
      });
    }
  }

  public onEditorErrorChange(hasError: boolean): void {
    this.editorHasError = hasError;
    this.cdr.markForCheck();
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateTaskFormDialogComponent } from '../../forms/create-task-form-dialog/create-task-form-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Agent } from '../../shared/models/agent.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // Import this

describe('CreateTaskFormDialogComponent', () => {
  let component: CreateTaskFormDialogComponent;
  let fixture: ComponentFixture<CreateTaskFormDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateTaskFormDialogComponent>>;
  let sharedSnackbarServiceSpy: jasmine.SpyObj<SharedSnackbarService>;

  const mockAgent: Agent = {
    id: 1,
    tools: [],
    role: 'Test Role',
    goal: 'Test Goal',
    backstory: 'Test Backstory',
    allow_delegation: false,
    memory: false,
    max_iter: 10,
    llm_model: null,
    fcm_llm_model: null,
    llm_config: null,
    fcm_llm_config: null,
    llm_model_name: null,
    fcm_llm_model_name: null,
    // Optional properties
    llm_temperature: undefined,
    llm_context: undefined,
    comments: undefined,
    toolTitles: undefined,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    sharedSnackbarServiceSpy = jasmine.createSpyObj('SharedSnackbarService', [
      'show',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CreateTaskFormDialogComponent,
        ReactiveFormsModule,
        CommonModule,
        MatFormFieldModule,
        MatDialogModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        NoopAnimationsModule,
      ],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: SharedSnackbarService, useValue: sharedSnackbarServiceSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { agents: [mockAgent], projectId: 1 },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTaskFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the CreateTaskFormDialogComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default controls', () => {
    expect(component.taskForm).toBeDefined();
    expect(component.taskForm.contains('name')).toBeTruthy();
    expect(component.taskForm.contains('instructions')).toBeTruthy();
    expect(component.taskForm.contains('expected_output')).toBeTruthy();
    expect(component.taskForm.contains('agent')).toBeTruthy();
    expect(component.taskForm.contains('order')).toBeTruthy();
  });

  it('should make the form invalid when required fields are empty', () => {
    component.taskForm.setValue({
      name: '',
      instructions: '',
      expected_output: '',
      agent: null,
      order: null,
    });
    expect(component.taskForm.valid).toBeFalsy();
  });

  it('should make the form valid when required fields are filled', () => {
    component.taskForm.setValue({
      name: 'Test Task',
      instructions: 'Complete the task',
      expected_output: 'Expected Result',
      agent: null,
      order: 1,
    });
    expect(component.taskForm.valid).toBeTruthy();
  });

  it('should close the dialog with task data when onSubmit is called with valid form', () => {
    component.taskForm.setValue({
      name: 'Test Task',
      instructions: 'Complete the task',
      expected_output: 'Expected Result',
      agent: mockAgent,
      order: 1,
    });
    component.onSubmit();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      crew: 1,
      name: 'Test Task',
      instructions: 'Complete the task',
      expected_output: 'Expected Result',
      agent: 1,
      order: 1,
    });
  });

  it('should not close the dialog when onSubmit is called with invalid form', () => {
    component.taskForm.setValue({
      name: '',
      instructions: '',
      expected_output: '',
      agent: null,
      order: null,
    });
    component.onSubmit();

    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close the dialog when onCancel is called', () => {
    component.onCancel();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should assign agents from injected data', () => {
    expect(component.agents).toEqual([mockAgent]);
  });

  it('should mark all fields as touched when onSubmit is called', () => {
    spyOn(component.taskForm, 'markAllAsTouched');
    component.onSubmit();

    expect(component.taskForm.markAllAsTouched).toHaveBeenCalled();
  });
});

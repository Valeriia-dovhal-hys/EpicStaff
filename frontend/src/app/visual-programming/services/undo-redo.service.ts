// undo-redo.service.ts
import { Injectable } from '@angular/core';
import { FlowModel } from '../core/models/flow.model';
import { FlowService } from './flow.service';

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  private undoStack: FlowModel[] = [];
  private redoStack: FlowModel[] = [];

  constructor(private flowService: FlowService) {}

  /**
   * A simple deep clone using JSON serialization.
   * (Be aware: This approach has limitations if your objects include functions, Dates, etc.)
   */
  private _deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Returns a snapshot of the current flow state.
   */
  public snapshotCurrentState(): FlowModel {
    return this._deepClone(this.flowService.getFlowState());
  }

  /**
   * Apply a given flow state to the FlowService.
   */
  public applyFlowState(flowState: FlowModel): void {
    this.flowService.setFlow(flowState);
  }

  /**
   * Call this method right before an action that modifies the flow.
   * It saves the current state to the undo stack and clears the redo stack.
   */
  public stateChanged(): void {
    this.undoStack.push(this.snapshotCurrentState());
    this.redoStack = [];
  }

  /**
   * Undo the last action.
   */
  public onUndo(): void {
    if (!this.undoStack.length) {
      console.warn('Nothing to undo!');
      return;
    }
    // Save the current state into the redo stack.
    const currentState = this.snapshotCurrentState();
    const previousState = this.undoStack.pop()!;
    this.redoStack.push(currentState);
    // Restore the previous state.
    this.applyFlowState(previousState);
  }

  /**
   * Redo the last undone action.
   */
  public onRedo(): void {
    if (!this.redoStack.length) {
      console.warn('Nothing to redo!');
      return;
    }
    const currentState = this.snapshotCurrentState();
    const nextState = this.redoStack.pop()!;
    this.undoStack.push(currentState);
    // Restore the next state.
    this.applyFlowState(nextState);
  }

  // Getter for undoStack
  public getUndoStack(): FlowModel[] {
    return this.undoStack;
  }

  // Setter for undoStack
  public setUndoStack(stack: FlowModel[]): void {
    this.undoStack = stack;
  }

  // Getter for redoStack
  public getRedoStack(): FlowModel[] {
    return this.redoStack;
  }

  // Setter for redoStack
  public setRedoStack(stack: FlowModel[]): void {
    this.redoStack = stack;
  }
}

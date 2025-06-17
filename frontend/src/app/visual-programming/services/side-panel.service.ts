import { Injectable, signal } from '@angular/core';
import { NodeModel } from '../core/models/node.model';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmationDialogComponent } from '../../shared/components/cofirm-dialog/confirmation-dialog.component';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SidePanelState {
  selectedNode: NodeModel | null;
  hasUnsavedChanges: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SidePanelService {
  private state = new BehaviorSubject<SidePanelState>({
    selectedNode: null,
    hasUnsavedChanges: false,
  });

  constructor(private readonly dialog: Dialog) {}

  public getState(): Observable<SidePanelState> {
    return this.state.asObservable();
  }

  public getCurrentState(): SidePanelState {
    return this.state.getValue();
  }

  public setHasUnsavedChanges(hasChanges: boolean): void {
    this.state.next({
      ...this.state.getValue(),
      hasUnsavedChanges: hasChanges,
    });
  }

  public trySelectNode(node: NodeModel): Promise<boolean> {
    const currentState = this.state.getValue();

    if (currentState.selectedNode?.id === node.id) {
      return Promise.resolve(true);
    }

    if (currentState.selectedNode && currentState.hasUnsavedChanges) {
      return this.showUnsavedChangesDialog('switch').then((canSwitch) => {
        if (canSwitch) {
          this.selectNode(node);
          return true;
        }
        return false;
      });
    }

    this.selectNode(node);
    return Promise.resolve(true);
  }

  public tryClosePanel(): Promise<boolean> {
    console.log('try close panel triggered', this.state.getValue());

    const currentState = this.state.getValue();

    if (!currentState.hasUnsavedChanges) {
      this.closePanel();
      return Promise.resolve(true);
    }

    return this.showUnsavedChangesDialog('close').then((canClose) => {
      if (canClose) {
        this.closePanel();
        return true;
      }
      return false;
    });
  }

  private selectNode(node: NodeModel): void {
    console.log('select node triggered', this.state.getValue());

    this.state.next({
      selectedNode: node,
      hasUnsavedChanges: false,
    });
  }

  private closePanel(): void {
    console.log(
      'close panel triggered in side panel service',
      this.state.getValue()
    );

    this.state.next({
      selectedNode: null,
      hasUnsavedChanges: false,
    });
  }

  private showUnsavedChangesDialog(
    action: 'close' | 'switch'
  ): Promise<boolean> {
    let message: string;
    let confirmText: string;
    let title: string;
    let cancelText: string;

    if (action === 'switch') {
      message =
        'You are trying to open a different side panel but have unsaved changes in the current one. Are you sure you want to proceed without saving?';
      confirmText = 'Yes, Switch Panel';
      title = 'Unsaved Changes';
      cancelText = 'Cancel';
    } else {
      message =
        'You have unsaved changes. Are you sure you want to close without saving?';
      confirmText = 'Yes, I am sure';
      title = 'Unsaved Changes';
      cancelText = 'Cancel';
    }

    const dialogRef = this.dialog.open<boolean>(ConfirmationDialogComponent, {
      data: {
        title,
        message,
        confirmText,
        cancelText,
        type: 'warning',
      },
    });

    return new Promise<boolean>((resolve) => {
      dialogRef.closed.subscribe((value) => resolve(!!value));
    });
  }
}

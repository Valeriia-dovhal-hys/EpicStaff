import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DialogModule, Dialog } from '@angular/cdk/dialog';

import { FlowsStorageService } from '../../../../services/flows-storage.service';
import { GraphDto } from '../../../../models/graph.model';
import {
  FlowCardComponent,
  FlowCardAction,
} from '../../../../components/flow-card/flow-card.component';
import { LoadingSpinnerComponent } from '../../../../../../shared/components/loading-spinner/loading-spinner.component';
import { FlowSessionsListComponent } from '../../../../components/flow-sessions-dialog/flow-sessions-list.component';

@Component({
  selector: 'app-my-flows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-flows.component.html',
  styleUrls: ['./my-flows.component.scss'],
  imports: [
    CommonModule,
    FlowCardComponent,

    LoadingSpinnerComponent,
    DialogModule,
  ],
})
export class MyFlowsComponent implements OnInit {
  private readonly flowsService = inject(FlowsStorageService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  public readonly error = signal<string | null>(null);
  public readonly filteredFlows = this.flowsService.filteredFlows;
  public readonly isFlowsLoaded = this.flowsService.isFlowsLoaded;

  public ngOnInit(): void {
    if (!this.flowsService.isFlowsLoaded()) {
      this.flowsService.getFlows().subscribe({
        next: () => {},
        error: (err: HttpErrorResponse) => {
          console.error('Error loading flows', err);
          this.error.set('Failed to load flows. Please try again later.');
        },
      });
    }
  }

  public onOpenFlow(id: number): void {
    this.router.navigate(['/flows', id]);
  }

  public handleFlowCardAction(event: FlowCardAction): void {
    const { action, flow } = event;
    switch (action) {
      case 'open':
        this.onOpenFlow(flow.id);
        break;

      case 'delete':
        console.log('Attempting to delete flow:', flow.name);
        this.flowsService.deleteFlow(flow.id).subscribe({
          next: () => {
            console.log(`Flow ${flow.id} - ${flow.name} deleted successfully.`);
          },
          error: (err) => {
            console.error(`Error deleting flow ${flow.id} - ${flow.name}`, err);
          },
        });
        break;
      case 'viewSessions':
        console.log('View sessions for flow:', flow.name);
        this.dialog.open(FlowSessionsListComponent, {
          data: { flow },

          panelClass: 'custom-dialog-panel',
        });
        break;
      default:
        console.log(`Action '${action}' not implemented for flow:`, flow.id);
    }
  }
}

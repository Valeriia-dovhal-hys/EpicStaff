import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxComponent } from '../../../../shared/components/form-controls/checkbox/checkbox.component';
import {
  GraphSession,
  GraphSessionStatus,
} from '../../services/flows-sessions.service';
import { GraphDto } from '../../models/graph.model';
import { FlowSessionStatusBadgeComponent } from './flow-session-status-badge.component';
import { FlowSessionStatusFilterDropdownComponent } from './flow-session-status-filter-dropdown.component';

@Component({
  selector: 'app-flow-sessions-table',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxComponent,
    FlowSessionStatusBadgeComponent,
    FlowSessionStatusFilterDropdownComponent,
  ],
  template: `
    <div
      style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px;"
    >
      <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
        <!-- <input
          type="text"
          placeholder="Search sessions..."
          class="session-search-input"
          [value]="searchQuery"
          (input)="onSearch($event)"
        /> -->
        <app-flow-session-status-filter-dropdown
          [value]="statusFilter"
          (valueChange)="onStatusFilterChange($event)"
        ></app-flow-session-status-filter-dropdown>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button
          *ngIf="selectedSessionIds().size > 0"
          class="delete-btn"
          (click)="onBulkDelete()"
        >
          Delete Selected
        </button>
      </div>
    </div>
    <div class="sessions-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>
              <app-checkbox
                [checked]="areAllSessionsSelected()"
                (checkedChange)="toggleSelectAll($event)"
                id="select-all-checkbox"
                label=""
              ></app-checkbox>
            </th>
            <th>ID</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Finished At</th>
            <th>Actions</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let session of filteredSessions(); trackBy: trackById">
            <td>
              <app-checkbox
                [checked]="isSessionSelected(session.id)"
                (checkedChange)="toggleSessionSelection(session.id, $event)"
                [id]="'session-checkbox-' + session.id"
              ></app-checkbox>
            </td>
            <td>{{ session.id }}</td>
            <td>
              <app-flow-session-status-badge
                [status]="session.status"
              ></app-flow-session-status-badge>
            </td>
            <td>{{ session.created_at | date : 'medium' }}</td>
            <td>
              {{
                session.finished_at
                  ? (session.finished_at | date : 'medium')
                  : 'Active'
              }}
            </td>
            <td>
              <div class="actions-container">
                <button class="view-btn" (click)="onViewSession(session.id)">
                  View
                </button>
                <button
                  *ngIf="
                    session.status === GraphSessionStatus.RUNNING ||
                    session.status === GraphSessionStatus.WAITING_FOR_USER ||
                    session.status === GraphSessionStatus.PENDING
                  "
                  class="stop-btn"
                  (click)="onStopSession(session.id)"
                  title="Stop session"
                  style="margin-left: 8px;"
                >
                  Stop
                </button>
              </div>
            </td>
            <td>
              <button
                class="icon-btn delete-icon-btn"
                (click)="onDeleteSession(session.id)"
                title="Delete session"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-x"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls: ['./flow-sessions-table.component.scss'],
})
export class FlowSessionsTableComponent {
  @Input() public sessions: GraphSession[] = [];
  @Input() public flow!: GraphDto;
  @Output() public deleteSelected = new EventEmitter<number[]>();
  @Output() public viewSession = new EventEmitter<number>();
  @Output() public stopSession = new EventEmitter<number>();

  public selectedSessionIds = signal<Set<number>>(new Set<number>());
  public searchQuery = '';
  public statusFilter: string[] = ['all'];

  public readonly GraphSessionStatus = GraphSessionStatus;

  public statusOptions = [
    { value: GraphSessionStatus.RUNNING, label: 'Running' },
    { value: GraphSessionStatus.ERROR, label: 'Error' },
    { value: GraphSessionStatus.ENDED, label: 'Completed' },
    { value: GraphSessionStatus.WAITING_FOR_USER, label: 'Waiting' },
    { value: GraphSessionStatus.PENDING, label: 'Pending' },
    { value: GraphSessionStatus.EXPIRED, label: 'Expired' },
  ];

  public filteredSessions = signal<GraphSession[]>([]);

  constructor(private cdr: ChangeDetectorRef) {}

  public ngOnChanges() {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  public applyFilter() {
    const query = this.searchQuery.toLowerCase();
    this.filteredSessions.set(
      this.sessions.filter((s) => {
        const matchesQuery =
          !query ||
          s.id.toString().includes(query) ||
          (s.status && s.status.toLowerCase().includes(query));
        const statusFilter = this.statusFilter;
        const matchesStatus =
          !statusFilter ||
          statusFilter.includes('all') ||
          statusFilter.includes(s.status);
        return matchesQuery && matchesStatus;
      })
    );
    this.cdr.markForCheck();
  }

  public onStatusFilterChange(values: string[]) {
    this.statusFilter = values;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  public onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  public isSessionSelected(sessionId: number): boolean {
    return this.selectedSessionIds().has(sessionId);
  }

  public toggleSessionSelection(sessionId: number, checked: boolean): void {
    this.selectedSessionIds.update((set) => {
      const newSet = new Set(set);
      if (checked) {
        newSet.add(sessionId);
      } else {
        newSet.delete(sessionId);
      }
      return newSet;
    });
    this.cdr.markForCheck();
  }

  public areAllSessionsSelected(): boolean {
    const allIds = this.filteredSessions().map((s) => s.id);
    return (
      allIds.length > 0 &&
      allIds.every((id) => this.selectedSessionIds().has(id))
    );
  }

  public toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectedSessionIds.set(
        new Set(this.filteredSessions().map((s) => s.id))
      );
    } else {
      this.selectedSessionIds.set(new Set());
    }
    this.cdr.markForCheck();
  }

  public onBulkDelete(): void {
    this.deleteSelected.emit(Array.from(this.selectedSessionIds()));
    this.selectedSessionIds.set(new Set());
    this.cdr.markForCheck();
  }

  public onDeleteSession(sessionId: number): void {
    this.deleteSelected.emit([sessionId]);
    this.cdr.markForCheck();
  }

  public onViewSession(sessionId: number): void {
    this.viewSession.emit(sessionId);
  }

  public onStopSession(sessionId: number): void {
    this.stopSession.emit(sessionId);
  }

  public trackById(index: number, item: GraphSession) {
    return item.id;
  }
}

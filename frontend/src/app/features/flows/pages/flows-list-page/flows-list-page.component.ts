import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import {
  GraphDto,
  CreateGraphDtoRequest,
  UpdateGraphDtoRequest,
} from '../../models/graph.model';
import { FlowsApiService } from '../../services/flows-api.service';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { CreateFlowDialogComponent } from '../../../../pages/flows-page/components/flow-dialog/create-flow-dialog.component';

import { Dialog } from '@angular/cdk/dialog';

import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import { TabButtonComponent } from '../../../../shared/components/tab-button/tab-button.component';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';
import {
  FiltersListComponent,
  SearchFilterChange,
} from '../../../../shared/components/filters-list/filters-list.component';
import { FlowsStorageService } from '../../services/flows-storage.service';

@Component({
  selector: 'app-flows-list-page',
  standalone: true,
  templateUrl: './flows-list-page.component.html',
  styleUrls: ['./flows-list-page.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonComponent,
    TabButtonComponent,

    FiltersListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsListPageComponent {
  public tabs = [
    { label: 'My Flows', link: 'my' },
    { label: 'Templates', link: 'templates' },
  ];

  private dialog = inject(Dialog);

  private flowStorageService = inject(FlowsStorageService);
  private router = inject(Router);
  constructor() {}

  public onFiltersChange(event: SearchFilterChange): void {
    this.flowStorageService.setFilter(event);
  }

  public openCreateFlowDialog(): void {
    const dialogRef = this.dialog.open<GraphDto | undefined>(
      CreateFlowDialogComponent,
      {
        width: '500px',
      }
    );

    dialogRef.closed.subscribe((result: GraphDto | undefined) => {
      if (result) {
        this.router.navigate(['/flows', result.id]);
      }
    });
  }
}

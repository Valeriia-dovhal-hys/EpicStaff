import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
} from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { TabButtonComponent } from '../../../../shared/components/tab-button/tab-button.component';
import { ButtonComponent } from '../../../../shared/components/buttons/button/button.component';
import {
  FiltersListComponent,
  SearchFilterChange,
} from '../../../../shared/components/filters-list/filters-list.component';
import { CustomToolDialogComponent } from '../../../../user-settings-page/tools/custom-tool-editor/custom-tool-dialog.component';
import { CustomToolsStorageService } from '../../services/custom-tools/custom-tools-storage.service';
import { BuiltinToolsStorageService } from '../../services/builtin-tools/builtin-tools-storage.service';
import { GetPythonCodeToolRequest } from '../../models/python-code-tool.model';

@Component({
  selector: 'app-tools-list-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TabButtonComponent,
    ButtonComponent,
    FiltersListComponent,
  ],
  templateUrl: './tools-list-page.component.html',
  styleUrls: ['./tools-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsListPageComponent {
  public tabs = [
    { label: 'Built-in', link: 'built-in' },
    { label: 'Custom', link: 'custom' },
  ];

  constructor(
    private readonly cdkDialog: Dialog,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly customToolsStorageService: CustomToolsStorageService,
    private readonly builtinToolsStorageService: BuiltinToolsStorageService
  ) {}

  public onSearchChange(filterChange: SearchFilterChange): void {
    // Update both storage services with the search term
    const searchTerm = filterChange.searchTerm?.trim() || '';

    // Only update if the search term actually changed to prevent unnecessary resets
    const currentBuiltinFilter = this.builtinToolsStorageService.filters();
    const currentCustomFilter = this.customToolsStorageService.filters();

    if (currentBuiltinFilter?.searchTerm !== searchTerm) {
      console.log('Updating builtin search term:', searchTerm);
      this.builtinToolsStorageService.setSearchTerm(searchTerm);
    }

    if (currentCustomFilter?.searchTerm !== searchTerm) {
      console.log('Updating custom search term:', searchTerm);
      this.customToolsStorageService.setSearchTerm(searchTerm);
    }
  }

  public openCustomToolDialog(): void {
    const dialogRef = this.cdkDialog.open(CustomToolDialogComponent, {
      data: { pythonTools: this.customToolsStorageService.allTools() }, // Pass cached tools
    });

    dialogRef.closed.subscribe((result) => {
      if (result) {
        console.log('New tool created:', result);
        // The tool is automatically added to cache via the storage service
        // Navigate to custom tools tab after creating a tool
        this.router.navigate(['/tools/custom']);
        this.cdr.markForCheck();
      }
    });
  }
}

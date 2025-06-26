import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
  OnDestroy,
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
import { CustomToolDialogComponent } from '../../../../user-settings-page/tools/custom-tool-editor/custom-tool-dialog.component';
import { CustomToolsStorageService } from '../../services/custom-tools/custom-tools-storage.service';
import { BuiltinToolsStorageService } from '../../services/builtin-tools/builtin-tools-storage.service';
import { GetPythonCodeToolRequest } from '../../models/python-code-tool.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-tools-list-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TabButtonComponent,
    ButtonComponent,
    FormsModule,
    AppIconComponent,
  ],
  templateUrl: './tools-list-page.component.html',
  styleUrls: ['./tools-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsListPageComponent implements OnDestroy {
  public tabs = [
    { label: 'Built-in', link: 'built-in' },
    { label: 'Custom', link: 'custom' },
  ];

  // Search term for ngModel binding
  public searchTerm: string = '';

  // For debounce
  private searchTerms = new Subject<string>();
  private subscription: Subscription;

  constructor(
    private readonly cdkDialog: Dialog,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly customToolsStorageService: CustomToolsStorageService,
    private readonly builtinToolsStorageService: BuiltinToolsStorageService
  ) {
    // Setup search with debounce
    this.subscription = this.searchTerms
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.updateSearch(term);
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Reset search filters when component is destroyed
    this.searchTerm = '';
    this.builtinToolsStorageService.setSearchTerm('');
    this.customToolsStorageService.setSearchTerm('');
  }

  public onSearchTermChange(term: string): void {
    this.searchTerms.next(term);
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.updateSearch('');
  }

  private updateSearch(searchTerm: string): void {
    // Update both storage services with the search term
    const trimmedTerm = searchTerm?.trim() || '';

    // Only update if the search term actually changed to prevent unnecessary resets
    const currentBuiltinFilter = this.builtinToolsStorageService.filters();
    const currentCustomFilter = this.customToolsStorageService.filters();

    if (currentBuiltinFilter?.searchTerm !== trimmedTerm) {
      this.builtinToolsStorageService.setSearchTerm(trimmedTerm);
    }

    if (currentCustomFilter?.searchTerm !== trimmedTerm) {
      this.customToolsStorageService.setSearchTerm(trimmedTerm);
    }

    // Force change detection to update the view
    this.cdr.markForCheck();
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

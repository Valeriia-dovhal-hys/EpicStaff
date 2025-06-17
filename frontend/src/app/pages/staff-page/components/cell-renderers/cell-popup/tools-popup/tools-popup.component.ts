import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

import { GetPythonCodeToolRequest } from '../../../../../../features/tools/models/python-code-tool.model';
import { ToolsService } from '../../../../../../features/tools/services/tools.service';
import { ToolConfigService } from '../../../../../../services/tool_config.service';
import {
  FullToolConfig,
  FullToolConfigService,
} from '../../../../../../services/full-tool-config.service';
import { PythonCodeToolService } from '../../../../../../user-settings-page/tools/custom-tool-editor/services/pythonCodeToolService.service';
import { GetToolConfigRequest } from '../../../../../../shared/models/tool_config,model';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../../../services/notifications/toast.service';

@Component({
  selector: 'app-tools-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './tools-popup.component.html',
  styleUrls: ['./tools-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ height: '*', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1 }),
        animate('200ms ease-out', style({ height: '0', opacity: 0 })),
      ]),
    ]),
  ],
})
export class ToolsPopupComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @ViewChild('searchInput') searchInput!: ElementRef;

  public tools: FullToolConfig[] = [];
  public pythonTools: GetPythonCodeToolRequest[] = [];
  public selectedToolConfigs = new Set<number>();
  public selectedPythonTools = new Set<number>();
  public showPythonTools = false;
  public searchTerm = ''; // Bound to the search input via ngModel
  public expandedToolConfigs = new Set<number>();
  public loading = true;

  public menuItems = [
    { type: false, label: 'Built-in Tools' },
    { type: true, label: 'Custom Tools' },
  ];
  public selectedMenu = false;
  private readonly _destroyed$ = new Subject<void>();

  @Input() public mergedTools: { id: number; name: string; type: string }[] =
    [];
  @Output() public mergedToolsUpdated = new EventEmitter<
    { id: number; name: string; type: string }[]
  >();

  constructor(
    private readonly _toolsService: ToolsService,
    private readonly _toolConfigService: ToolConfigService,
    private readonly _pythonCodeToolService: PythonCodeToolService,
    private readonly _fullToolConfigService: FullToolConfigService,
    private readonly _cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    console.log('ToolsPopupComponent initialized.');
    this.loadToolsData();
  }

  ngAfterViewInit(): void {
    // Automatically focus search input
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mergedTools']) {
      console.log(
        'Detected changes in mergedTools input:',
        changes['mergedTools'].currentValue
      );
      this._preselectMergedTools();
    }
  }

  ngOnDestroy(): void {
    console.log('ToolsPopupComponent destroyed.');
    this._destroyed$.next();
    this._destroyed$.complete();
  }

  loadToolsData(): void {
    console.log('Loading tools data...');
    this.loading = true;
    forkJoin({
      fullTools: this._fullToolConfigService.getFullToolConfigs(),
      pythonTools: this._pythonCodeToolService.getPythonCodeTools(),
    })
      .pipe(takeUntil(this._destroyed$))
      .subscribe({
        next: ({ fullTools, pythonTools }) => {
          console.log('Full tools data received:', fullTools);
          console.log('Python tools data received:', pythonTools);

          // Move selected tools to the top of the list
          this.tools = this._sortToolsBySelection(fullTools);
          this.pythonTools = this._sortPythonToolsBySelection(pythonTools);

          this._preselectMergedTools();
          this.loading = false;
          this._cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading tools data:', err);
          this.loading = false;
          this._cdr.markForCheck();
        },
      });
  }

  // Computed getter for filtering built-in tools based on searchTerm
  get filteredTools(): FullToolConfig[] {
    let toolsToFilter = this.tools;

    if (this.searchTerm) {
      const query = this.searchTerm.toLowerCase();
      toolsToFilter = toolsToFilter.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.toolConfigs.some((config) =>
            config.name.toLowerCase().includes(query)
          )
      );
    }

    return this._sortToolsBySelection(toolsToFilter);
  }

  // Computed getter for filtering python/custom tools based on searchTerm
  get filteredPythonTools(): GetPythonCodeToolRequest[] {
    let toolsToFilter = this.pythonTools;

    if (this.searchTerm) {
      const query = this.searchTerm.toLowerCase();
      toolsToFilter = toolsToFilter.filter((pTool) =>
        pTool.name.toLowerCase().includes(query)
      );
    }

    return this._sortPythonToolsBySelection(toolsToFilter);
  }

  // Helper method to sort tools with selected items at the top
  private _sortToolsBySelection(tools: FullToolConfig[]): FullToolConfig[] {
    return tools.sort((a, b) => {
      const aSelected = this.isToolSelected(a);
      const bSelected = this.isToolSelected(b);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }

  // Helper method to sort python tools with selected items at the top
  private _sortPythonToolsBySelection(
    tools: GetPythonCodeToolRequest[]
  ): GetPythonCodeToolRequest[] {
    return tools.sort((a, b) => {
      const aSelected = this.selectedPythonTools.has(a.id);
      const bSelected = this.selectedPythonTools.has(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }

  private _preselectMergedTools(): void {
    if (this.mergedTools && this.mergedTools.length) {
      const preselectedToolConfigIds = this.mergedTools
        .filter((item) => item.type === 'tool-config')
        .map((item) => item.id);
      this.selectedToolConfigs = new Set(preselectedToolConfigIds);
      const preselectedPythonToolIds = this.mergedTools
        .filter((item) => item.type === 'python-tool')
        .map((item) => item.id);
      this.selectedPythonTools = new Set(preselectedPythonToolIds);

      // Re-sort tools after preselection
      this.tools = this._sortToolsBySelection(this.tools);
      this.pythonTools = this._sortPythonToolsBySelection(this.pythonTools);
    }
  }

  toggleToolType(isPython: boolean): void {
    this.showPythonTools = isPython;
    this.selectedMenu = isPython;
    this._cdr.markForCheck();
  }

  onSelectMenu(type: boolean): void {
    this.selectedMenu = type;
    this.showPythonTools = type;
    this._cdr.markForCheck();
  }

  save(): void {
    const mergedToolConfigs = this.tools
      .flatMap((tool) => tool.toolConfigs)
      .filter((config) => this.selectedToolConfigs.has(config.id))
      .map((config) => ({
        id: config.id,
        name: config.name,
        type: 'tool-config',
      }));
    const mergedPythonTools = this.pythonTools
      .filter((pTool) => this.selectedPythonTools.has(pTool.id))
      .map((pTool) => ({
        id: pTool.id,
        name: pTool.name,
        type: 'python-tool',
      }));
    const updatedMergedTools = [...mergedToolConfigs, ...mergedPythonTools];
    this.mergedToolsUpdated.emit(updatedMergedTools);
  }

  onCheckboxToggle(tool: FullToolConfig): void {
    if (tool.toolConfigs.length === 1) {
      const config = tool.toolConfigs[0];
      if (!this.selectedToolConfigs.has(config.id)) {
        this.selectedToolConfigs.add(config.id);
      } else {
        this.selectedToolConfigs.delete(config.id);
      }

      // Re-sort tools after selection
      this.tools = this._sortToolsBySelection(this.tools);
      this._cdr.markForCheck();
    }
  }

  onPythonToolToggle(pTool: GetPythonCodeToolRequest): void {
    if (this.selectedPythonTools.has(pTool.id)) {
      this.selectedPythonTools.delete(pTool.id);
    } else {
      this.selectedPythonTools.add(pTool.id);
    }

    // Re-sort python tools after selection
    this.pythonTools = this._sortPythonToolsBySelection(this.pythonTools);
    this._cdr.markForCheck();
  }

  isToolSelected(tool: FullToolConfig): boolean {
    return tool.toolConfigs.some((config) =>
      this.selectedToolConfigs.has(config.id)
    );
  }

  toggleToolConfigs(tool: FullToolConfig): void {
    if (this.expandedToolConfigs.has(tool.id)) {
      this.expandedToolConfigs.delete(tool.id);
    } else {
      this.expandedToolConfigs.add(tool.id);
    }
    this._cdr.markForCheck();
  }

  onConfigToggle(config: GetToolConfigRequest): void {
    if (this.selectedToolConfigs.has(config.id)) {
      this.selectedToolConfigs.delete(config.id);
    } else {
      this.selectedToolConfigs.add(config.id);
    }

    // Re-sort tools after selection
    this.tools = this._sortToolsBySelection(this.tools);
    this._cdr.markForCheck();
  }

  onCreateConfig(tool: FullToolConfig): void {
    this.toastService.info(`Feature not implemented`);
  }
}

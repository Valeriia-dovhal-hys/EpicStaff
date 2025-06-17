import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, delay, shareReplay, catchError, switchMap } from 'rxjs/operators';

import {
  CreatePythonCodeToolRequest,
  GetPythonCodeToolRequest,
  UpdatePythonCodeToolRequest,
} from '../../models/python-code-tool.model';
import { CustomToolsApiService } from './custom-tools-api.service';

@Injectable({
  providedIn: 'root',
})
export class CustomToolsStorageService {
  private readonly customToolsApiService = inject(CustomToolsApiService);

  // --- State Signals ---
  private toolsSignal = signal<GetPythonCodeToolRequest[]>([]);
  private toolsLoaded = signal<boolean>(false);
  private filterSignal = signal<{ searchTerm?: string } | null>(null);

  // --- Public State Accessors ---
  public readonly isToolsLoaded = this.toolsLoaded.asReadonly();

  public readonly filters = this.filterSignal.asReadonly();

  public readonly filteredTools = computed(() => {
    let tools = this.toolsSignal();
    const filter = this.filterSignal();
    if (filter) {
      if (filter.searchTerm && filter.searchTerm.trim()) {
        const searchTerm = filter.searchTerm.toLowerCase();
        tools = tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.description.toLowerCase().includes(searchTerm)
        );
      }
    }
    // Always sort by id descending
    return tools.slice().sort((a, b) => b.id - a.id);
  });

  public readonly allTools = computed(() => this.toolsSignal());

  // --- State Mutators ---
  public setTools(tools: GetPythonCodeToolRequest[]) {
    this.toolsSignal.set(tools);
    this.toolsLoaded.set(true);
  }

  public setFilter(filter: { searchTerm?: string } | null) {
    if (!filter) {
      this.filterSignal.set(null);
      return;
    }

    // Merge with existing filter to preserve other filter options
    const currentFilter = this.filterSignal();
    const newFilter = {
      ...currentFilter,
      ...filter,
    };
    this.filterSignal.set(newFilter);
  }

  public setSearchTerm(searchTerm: string) {
    // Clean the search term and only set if it has actual content
    const cleanSearchTerm = searchTerm?.trim();
    this.filterSignal.update((currentFilter) => ({
      ...(currentFilter || {}),
      searchTerm: cleanSearchTerm || undefined,
    }));
  }

  public clearFilters() {
    this.filterSignal.set(null);
  }

  // --- Data Fetching Methods ---
  public getTools(
    forceRefresh = false
  ): Observable<GetPythonCodeToolRequest[]> {
    if (this.toolsLoaded() && !forceRefresh) {
      return of(this.toolsSignal());
    }
    return this.customToolsApiService.getPythonCodeTools().pipe(
      tap((tools) => {
        this.setTools(tools);
      }),
      delay(this.toolsLoaded() ? 0 : 300),
      shareReplay(1),
      catchError(() => {
        this.toolsLoaded.set(false);
        return of([]);
      })
    );
  }

  public getToolById(
    id: number
  ): Observable<GetPythonCodeToolRequest | undefined> {
    const cachedTool: GetPythonCodeToolRequest | undefined =
      this.toolsSignal().find((tool) => tool.id === id);
    if (cachedTool) {
      return of(cachedTool);
    }
    return this.customToolsApiService.getPythonCodeToolById(id).pipe(
      tap((tool) => {
        if (tool) {
          this.addToolToCache(tool);
        }
      }),
      catchError(() => of(undefined))
    );
  }

  // --- CRUD Methods ---
  public createTool(
    toolData: CreatePythonCodeToolRequest
  ): Observable<GetPythonCodeToolRequest> {
    return this.customToolsApiService.createPythonCodeTool(toolData).pipe(
      tap((newTool) => {
        console.log('New tool created in storage:', newTool);
        this.addToolToCache(newTool);
      })
    );
  }

  public updateTool(
    toolId: string,
    updatedTool: UpdatePythonCodeToolRequest
  ): Observable<GetPythonCodeToolRequest> {
    return this.customToolsApiService
      .updatePythonCodeTool(toolId, updatedTool)
      .pipe(
        tap((updatedToolResponse) => {
          const currentTools = this.toolsSignal();
          const index = currentTools.findIndex(
            (t) => t.id === updatedToolResponse.id
          );
          if (index !== -1) {
            const updatedToolsList = [...currentTools];
            updatedToolsList[index] = updatedToolResponse;
            this.toolsSignal.set(updatedToolsList);
          }
        })
      );
  }

  public deleteTool(toolId: number): Observable<void> {
    return this.customToolsApiService.deletePythonCodeTool(toolId).pipe(
      tap(() => {
        const currentTools = this.toolsSignal();
        this.toolsSignal.set(currentTools.filter((t) => t.id !== toolId));
      })
    );
  }

  // --- Cache Management ---
  public addToolToCache(newTool: GetPythonCodeToolRequest) {
    const currentTools = this.toolsSignal();
    if (!currentTools.some((t) => t.id === newTool.id)) {
      this.toolsSignal.set([newTool, ...currentTools]);
    }
  }

  public updateToolInStorage(updatedTool: GetPythonCodeToolRequest): void {
    const currentTools = this.toolsSignal();
    const index = currentTools.findIndex((t) => t.id === updatedTool.id);
    if (index !== -1) {
      const updatedToolsList = [...currentTools];
      updatedToolsList[index] = updatedTool;
      this.toolsSignal.set(updatedToolsList);
    }
  }

  // --- Utility Methods ---
  public ensureLoaded(): Observable<GetPythonCodeToolRequest[]> {
    if (this.toolsLoaded()) {
      return of(this.toolsSignal());
    }
    return this.getTools();
  }

  public refreshTools(): void {
    this.toolsLoaded.set(false);
    this.getTools(true).subscribe();
  }
}

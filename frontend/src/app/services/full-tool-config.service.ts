import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, map, switchMap } from 'rxjs';
import { Tool } from '../shared/models/tool.model';
import { ToolsService } from '../features/tools/services/tools.service';
import { ToolConfigService } from './tool_config.service';
import {
  CreateToolConfigRequest,
  GetToolConfigRequest,
} from '../shared/models/tool_config,model';

export interface FullToolConfig extends Tool {
  toolConfigs: GetToolConfigRequest[]; // List of related tool configurations
}

@Injectable({
  providedIn: 'root',
})
export class FullToolConfigService {
  constructor(
    private http: HttpClient,
    private toolService: ToolsService,
    private toolConfigService: ToolConfigService
  ) {}

  // Fetch tools and their related tool configs in parallel, and create missing tool configs if needed
  // Only return configs for tools that have enabled = true
  getFullToolConfigs(): Observable<FullToolConfig[]> {
    console.log('Starting to fetch tools and tool configs...');

    return forkJoin({
      tools: this.toolService.getTools(),
      toolConfigs: this.toolConfigService.getToolConfigs(),
    }).pipe(
      switchMap(({ tools, toolConfigs }) => {
        console.log('Fetched tools:', tools);
        console.log('Fetched tool configurations:', toolConfigs);

        // Filter only enabled tools
        const enabledTools = tools.filter((tool) => tool.enabled === true);
        console.log('Enabled tools:', enabledTools);

        // Filter tools that need configurations (only from enabled tools):
        const toolsNeedingConfigs = enabledTools.filter(
          (tool) =>
            tool.tool_fields.length === 0 && // Only tools with empty tool_fields
            !toolConfigs.some((config) => config.tool === tool.id) // And no existing configs
        );

        console.log('Tools needing configurations:', toolsNeedingConfigs);

        // If no tools need new configurations, return the updated tools directly
        if (toolsNeedingConfigs.length === 0) {
          console.log(
            'No tools need new configurations. Returning updated tools directly.'
          );
          const updatedTools = enabledTools.map((tool) => {
            const relatedToolConfigs = toolConfigs.filter(
              (config) => config.tool === tool.id
            );

            const updatedTool: FullToolConfig = {
              ...tool,
              toolConfigs: [...relatedToolConfigs],
            };

            console.log('Updated tool with configurations:', updatedTool);
            return updatedTool;
          });

          console.log(
            'Final list of updated tools with tool configs:',
            updatedTools
          );
          return of(updatedTools);
        }

        // If there are tools that need configurations, create them in parallel
        const toolConfigCreationRequests = toolsNeedingConfigs.map((tool) =>
          this.createToolConfigForTool(tool)
        );

        console.log(
          'Initiating creation of tool configurations for needed tools...'
        );

        return forkJoin(toolConfigCreationRequests).pipe(
          map((createdConfigs) => {
            console.log('Created tool configurations:', createdConfigs);

            // After creating the tool configs, associate them with their tools
            const updatedTools = enabledTools.map((tool) => {
              const relatedToolConfigs = toolConfigs.filter(
                (config) => config.tool === tool.id
              );

              // Add newly created tool configurations to the list
              const newToolConfigs = createdConfigs.filter(
                (newConfig) => newConfig.tool === tool.id
              );

              const updatedTool: FullToolConfig = {
                ...tool,
                toolConfigs: [...relatedToolConfigs, ...newToolConfigs],
              };

              console.log('Updated tool with configurations:', updatedTool);
              return updatedTool;
            });

            console.log(
              'Final list of updated tools with tool configs:',
              updatedTools
            );

            return updatedTools;
          })
        );
      })
    );
  }

  // Create tool config for a specific tool if it doesn't have one
  private createToolConfigForTool(
    tool: Tool
  ): Observable<GetToolConfigRequest> {
    const createConfig: CreateToolConfigRequest = {
      name: `${tool.name} Tool Config`, // You can customize the name
      configuration: {},
      tool: tool.id,
    };

    console.log('Creating tool config for tool:', tool);
    console.log('CreateToolConfigRequest payload:', createConfig);

    return this.toolConfigService.createToolConfig(createConfig).pipe(
      map((response) => {
        console.log('Tool configuration created successfully:', response);
        return response;
      })
    );
  }
}

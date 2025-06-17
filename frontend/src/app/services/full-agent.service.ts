import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AgentsService } from './staff.service';
import { LLM_Config_Service } from './LLM_config.service';
import { ToolConfigService } from './tool_config.service';
import { PythonCodeToolService } from '../user-settings-page/tools/custom-tool-editor/services/pythonCodeToolService.service';
import { LLM_Models_Service } from './LLM_models.service';
import { ProjectsService } from '../pages/projects-page/services/projects.service';

import { GetAgentRequest } from '../shared/models/agent.model';
import { GetLlmConfigRequest } from '../shared/models/LLM_config.model';
import { GetToolConfigRequest } from '../shared/models/tool_config,model';
import { GetPythonCodeToolRequest } from '../user-settings-page/tools/custom-tool-editor/models/python-code-tool.model';
import {
  RealtimeModelConfig,
  RealtimeModelConfigsService,
} from '../pages/models-page/services/realtime-models-services/real-time-model-config.service';
import {
  RealtimeModel,
  RealtimeModelsService,
} from '../pages/models-page/services/realtime-models-services/real-time-models.service';

export interface EnhancedLLMConfig extends GetLlmConfigRequest {
  modelName: string;
}

export interface EnhancedRealtimeConfig extends RealtimeModelConfig {
  modelName: string; // Store only the model name instead of the full details
}

export interface FullAgent extends GetAgentRequest {
  fullLlmConfig?: EnhancedLLMConfig | null;
  fullFcmLlmConfig?: EnhancedLLMConfig | null;
  fullRealtimeConfig?: EnhancedRealtimeConfig | null;
  fullConfiguredTools: GetToolConfigRequest[];
  fullPythonTools: GetPythonCodeToolRequest[];
  mergedTools: { id: number; name: string; type: string }[];
  mergedConfigs: {
    id: number;
    custom_name: string;
    model_name: string;
    type: string;
  }[];
  tags: string[];
}

export interface TableFullAgent extends Omit<FullAgent, 'id'> {
  id: number | string;
}

@Injectable({
  providedIn: 'root',
})
export class FullAgentService {
  constructor(
    private agentsService: AgentsService,
    private llmConfigService: LLM_Config_Service,
    private toolConfigService: ToolConfigService,
    private pythonCodeToolService: PythonCodeToolService,
    private llmModelsService: LLM_Models_Service,
    private projectsService: ProjectsService,
    private realtimeModelConfigsService: RealtimeModelConfigsService,
    private realtimeModelsService: RealtimeModelsService
  ) {}

  getFullAgents(): Observable<FullAgent[]> {
    return forkJoin({
      agents: this.agentsService.getAgents(),
      llmConfigs: this.llmConfigService.getAllConfigsLLM(),
      toolConfigs: this.toolConfigService.getToolConfigs(),
      pythonTools: this.pythonCodeToolService.getPythonCodeTools(),
      llmModels: this.llmModelsService.getLLMModels(),
      realtimeConfigs: this.realtimeModelConfigsService.getAllConfigs(),
      realtimeModels: this.realtimeModelsService.getAllModels(),
    }).pipe(
      map(
        ({
          agents,
          llmConfigs,
          toolConfigs,
          pythonTools,
          llmModels,
          realtimeConfigs,
          realtimeModels,
        }) => {
          const possibleTags = [
            'Premium',
            'Searcher',
            'Boxer',
            'Scientist',
            'Economist',
            'Programmer',
          ];

          return agents.map((agent) => {
            const findEnhancedConfig = (
              configId: number | null
            ): EnhancedLLMConfig | null => {
              if (configId === null) return null;
              const config = llmConfigs.find((cfg) => cfg.id === configId);
              if (config) {
                const model = llmModels.find((m) => m.id === config.model);
                return { ...config, modelName: model ? model.name : 'Unknown' };
              }
              return null;
            };

            const findEnhancedRealtimeConfig = (
              configId: number | null
            ): EnhancedRealtimeConfig | null => {
              if (configId === null) return null;
              const config = realtimeConfigs.find((cfg) => cfg.id === configId);
              if (config) {
                const modelDetails =
                  realtimeModels.find((m) => m.id === config.realtime_model) ||
                  null;
                return {
                  ...config,
                  modelName: modelDetails ? modelDetails.name : 'Unknown',
                };
              }
              return null;
            };

            // Use the helper functions, ensuring they don't receive `null`
            const fullLlmConfig = findEnhancedConfig(agent.llm_config);
            const fullFcmLlmConfig = findEnhancedConfig(agent.fcm_llm_config);
            const fullRealtimeConfig = findEnhancedRealtimeConfig(
              agent.realtime_config
            );

            // Tool configs
            const fullConfiguredTools = toolConfigs.filter((tool) =>
              agent.configured_tools.includes(tool.id)
            );
            const fullPythonTools = pythonTools.filter((pt) =>
              agent.python_code_tools.includes(pt.id)
            );

            // Merge both sets of tools
            const mergedTools = [
              ...fullConfiguredTools.map((tc) => ({
                id: tc.id,
                name: tc.name,
                type: 'tool-config',
              })),
              ...fullPythonTools.map((pt) => ({
                id: pt.id,
                name: pt.name,
                type: 'python-tool',
              })),
            ];

            const randomTagCount = Math.floor(Math.random() * 5) + 1;
            const randomTags: string[] = [];
            for (let i = 0; i < randomTagCount; i++) {
              const randomIndex = Math.floor(
                Math.random() * possibleTags.length
              );
              randomTags.push(possibleTags[randomIndex]);
            }

            // Merge LLM and realtime configs
            const mergedConfigs = [];

            if (fullLlmConfig) {
              mergedConfigs.push({
                id: fullLlmConfig.id,
                custom_name: fullLlmConfig.custom_name,
                model_name: fullLlmConfig.modelName,
                type: 'llm-config',
              });
            }

            if (fullRealtimeConfig) {
              mergedConfigs.push({
                id: fullRealtimeConfig.id,
                custom_name: fullRealtimeConfig.custom_name,
                model_name: fullRealtimeConfig.modelName,
                type: 'realtime-config',
              });
            }

            return {
              ...agent,
              fullLlmConfig,
              fullFcmLlmConfig,
              fullRealtimeConfig,
              fullConfiguredTools,
              fullPythonTools,
              mergedTools,
              mergedConfigs,
              tags: randomTags,
            };
          });
        }
      )
    );
  }

  getFullAgentsByProject(projectId: number): Observable<FullAgent[]> {
    // Fetch project and all other data concurrently
    return forkJoin({
      project: this.projectsService.getProjectById(projectId),
      agents: this.agentsService.getAgents(),
      llmConfigs: this.llmConfigService.getAllConfigsLLM(),
      toolConfigs: this.toolConfigService.getToolConfigs(),
      pythonTools: this.pythonCodeToolService.getPythonCodeTools(),
      llmModels: this.llmModelsService.getLLMModels(),
      realtimeConfigs: this.realtimeModelConfigsService.getAllConfigs(),
      realtimeModels: this.realtimeModelsService.getAllModels(),
    }).pipe(
      map(
        ({
          project,
          agents,
          llmConfigs,
          toolConfigs,
          pythonTools,
          llmModels,
          realtimeConfigs,
          realtimeModels,
        }) => {
          const possibleTags = [
            'Premium',
            'Searcher',
            'Boxer',
            'Scientist',
            'Economist',
            'Programmer',
          ];

          // Filter agents to include only those related to the project
          const projectAgentIds = project.agents; // Agents field from the project

          const filteredAgents = agents.filter(
            (agent) => projectAgentIds.includes(agent.id) // Keep only agents present in the project
          );

          return filteredAgents.map((agent) => {
            const findEnhancedConfig = (
              configId: number | null
            ): EnhancedLLMConfig | null => {
              if (configId === null) return null;
              const config = llmConfigs.find((cfg) => cfg.id === configId);
              if (config) {
                const model = llmModels.find((m) => m.id === config.model);
                return { ...config, modelName: model ? model.name : 'Unknown' };
              }
              return null;
            };

            const findEnhancedRealtimeConfig = (
              configId: number | null
            ): EnhancedRealtimeConfig | null => {
              if (configId === null) return null;
              const config = realtimeConfigs.find((cfg) => cfg.id === configId);
              if (config) {
                const modelDetails =
                  realtimeModels.find((m) => m.id === config.realtime_model) ||
                  null;
                return {
                  ...config,
                  modelName: modelDetails ? modelDetails.name : 'Unknown',
                };
              }
              return null;
            };

            // Use the helper functions
            const fullLlmConfig = findEnhancedConfig(agent.llm_config);
            const fullFcmLlmConfig = findEnhancedConfig(agent.fcm_llm_config);
            const fullRealtimeConfig = findEnhancedRealtimeConfig(
              agent.realtime_config
            );

            // Tool configs
            const fullConfiguredTools = toolConfigs.filter((tool) =>
              agent.configured_tools.includes(tool.id)
            );
            const fullPythonTools = pythonTools.filter((pt) =>
              agent.python_code_tools.includes(pt.id)
            );

            // Merge both sets of tools
            const mergedTools = [
              ...fullConfiguredTools.map((tc) => ({
                id: tc.id,
                name: tc.name,
                type: 'tool-config',
              })),
              ...fullPythonTools.map((pt) => ({
                id: pt.id,
                name: pt.name,
                type: 'python-tool',
              })),
            ];

            const randomTagCount = Math.floor(Math.random() * 5) + 1;
            const randomTags: string[] = [];
            for (let i = 0; i < randomTagCount; i++) {
              const randomIndex = Math.floor(
                Math.random() * possibleTags.length
              );
              randomTags.push(possibleTags[randomIndex]);
            }

            // Merge LLM and realtime configs
            const mergedConfigs = [];

            if (fullLlmConfig) {
              mergedConfigs.push({
                id: fullLlmConfig.id,
                custom_name: fullLlmConfig.custom_name,
                model_name: fullLlmConfig.modelName,
                type: 'llm-config',
              });
            }

            if (fullRealtimeConfig) {
              mergedConfigs.push({
                id: fullRealtimeConfig.id,
                custom_name: fullRealtimeConfig.custom_name,
                model_name: fullRealtimeConfig.modelName,
                type: 'realtime-config',
              });
            }

            return {
              ...agent,
              fullLlmConfig,
              fullFcmLlmConfig,
              fullRealtimeConfig,
              fullConfiguredTools,
              fullPythonTools,
              mergedTools,
              mergedConfigs,
              tags: randomTags,
            };
          });
        }
      )
    );
  }

  getFullAgentById(agentId: number): Observable<FullAgent | null> {
    return forkJoin({
      agents: this.agentsService.getAgents(),
      llmConfigs: this.llmConfigService.getAllConfigsLLM(),
      toolConfigs: this.toolConfigService.getToolConfigs(),
      pythonTools: this.pythonCodeToolService.getPythonCodeTools(),
      llmModels: this.llmModelsService.getLLMModels(),
      realtimeConfigs: this.realtimeModelConfigsService.getAllConfigs(),
      realtimeModels: this.realtimeModelsService.getAllModels(),
    }).pipe(
      map(
        ({
          agents,
          llmConfigs,
          toolConfigs,
          pythonTools,
          llmModels,
          realtimeConfigs,
          realtimeModels,
        }) => {
          // Find the agent with the specified ID
          const agent = agents.find((agent) => agent.id === agentId);

          // If no agent is found, return null
          if (!agent) {
            return null;
          }

          const possibleTags = [
            'Premium',
            'Searcher',
            'Boxer',
            'Scientist',
            'Economist',
            'Programmer',
          ];

          const findEnhancedConfig = (
            configId: number | null
          ): EnhancedLLMConfig | null => {
            if (configId === null) return null;
            const config = llmConfigs.find((cfg) => cfg.id === configId);
            if (config) {
              const model = llmModels.find((m) => m.id === config.model);
              return { ...config, modelName: model ? model.name : 'Unknown' };
            }
            return null;
          };

          const findEnhancedRealtimeConfig = (
            configId: number | null
          ): EnhancedRealtimeConfig | null => {
            if (configId === null) return null;
            const config = realtimeConfigs.find((cfg) => cfg.id === configId);
            if (config) {
              const modelDetails =
                realtimeModels.find((m) => m.id === config.realtime_model) ||
                null;
              return {
                ...config,
                modelName: modelDetails ? modelDetails.name : 'Unknown',
              };
            }
            return null;
          };

          // Use the helper functions
          const fullLlmConfig = findEnhancedConfig(agent.llm_config);
          const fullFcmLlmConfig = findEnhancedConfig(agent.fcm_llm_config);
          const fullRealtimeConfig = findEnhancedRealtimeConfig(
            agent.realtime_config
          );

          // Tool configs
          const fullConfiguredTools = toolConfigs.filter((tool) =>
            agent.configured_tools.includes(tool.id)
          );
          const fullPythonTools = pythonTools.filter((pt) =>
            agent.python_code_tools.includes(pt.id)
          );

          // Merge both sets of tools
          const mergedTools = [
            ...fullConfiguredTools.map((tc) => ({
              id: tc.id,
              name: tc.name,
              type: 'tool-config',
            })),
            ...fullPythonTools.map((pt) => ({
              id: pt.id,
              name: pt.name,
              type: 'python-tool',
            })),
          ];

          const randomTagCount = Math.floor(Math.random() * 5) + 1;
          const randomTags: string[] = [];
          for (let i = 0; i < randomTagCount; i++) {
            const randomIndex = Math.floor(Math.random() * possibleTags.length);
            randomTags.push(possibleTags[randomIndex]);
          }

          // Merge LLM and realtime configs
          const mergedConfigs = [];

          if (fullLlmConfig) {
            mergedConfigs.push({
              id: fullLlmConfig.id,
              custom_name: fullLlmConfig.custom_name,
              model_name: fullLlmConfig.modelName,
              type: 'llm-config',
            });
          }

          if (fullRealtimeConfig) {
            mergedConfigs.push({
              id: fullRealtimeConfig.id,
              custom_name: fullRealtimeConfig.custom_name,
              model_name: fullRealtimeConfig.modelName,
              type: 'realtime-config',
            });
          }

          return {
            ...agent,
            fullLlmConfig,
            fullFcmLlmConfig,
            fullRealtimeConfig,
            fullConfiguredTools,
            fullPythonTools,
            mergedTools,
            mergedConfigs,
            tags: randomTags,
          };
        }
      )
    );
  }
}

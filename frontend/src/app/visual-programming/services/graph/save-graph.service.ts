import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, EMPTY, throwError, from } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

import { FlowsApiService } from '../../../features/flows/services/flows-api.service';
import { GetProjectRequest } from '../../../features/projects/models/project.model';
import { NodeType } from '../../core/enums/node-type';
import { ConnectionModel } from '../../core/models/connection.model';
import { FlowModel } from '../../core/models/flow.model';
import {
  ProjectNodeModel,
  PythonNodeModel,
  EdgeNodeModel,
  StartNodeModel,
  LLMNodeModel,
  NodeModel,
} from '../../core/models/node.model';

import { ToastService } from '../../../services/notifications/toast.service';
import {
  GetConditionalEdgeRequest,
  CreateConditionalEdgeRequest,
} from '../../../pages/flows-page/components/flow-visual-programming/models/conditional-edge.model';
import {
  CrewNode,
  CreateCrewNodeRequest,
} from '../../../pages/flows-page/components/flow-visual-programming/models/crew-node.model';
import {
  Edge,
  CreateEdgeRequest,
} from '../../../pages/flows-page/components/flow-visual-programming/models/edge.model';
import {
  GetLLMNodeRequest,
  CreateLLMNodeRequest,
} from '../../../pages/flows-page/components/flow-visual-programming/models/llm-node.model';
import {
  PythonNode,
  CreatePythonNodeRequest,
} from '../../../pages/flows-page/components/flow-visual-programming/models/python-node.model';
import { ConditionalEdgeService } from '../../../pages/flows-page/components/flow-visual-programming/services/conditional-edge.service';
import { CrewNodeService } from '../../../pages/flows-page/components/flow-visual-programming/services/crew-node.service';
import { EdgeService } from '../../../pages/flows-page/components/flow-visual-programming/services/edge.service';
import { LLMNodeService } from '../../../pages/flows-page/components/flow-visual-programming/services/llm-node.service';
import { PythonNodeService } from '../../../pages/flows-page/components/flow-visual-programming/services/python-node.service';
import {
  GraphDto,
  UpdateGraphDtoRequest,
} from '../../../features/flows/models/graph.model';

@Injectable({
  providedIn: 'root',
})
export class GraphUpdateService {
  constructor(
    private crewNodeService: CrewNodeService,
    private pythonNodeService: PythonNodeService,
    private conditionalEdgeService: ConditionalEdgeService,
    private edgeService: EdgeService,
    private graphService: FlowsApiService,
    private llmNodeService: LLMNodeService,
    private toastService: ToastService
  ) {}

  /**
   * Clears all ports on nodes to null before saving
   * This reduces the metadata size and prevents storing unnecessary port data
   */
  private clearNodePorts(flowState: FlowModel): FlowModel {
    // Create a deep copy of the flow state to avoid mutating the original
    const flowStateCopy: FlowModel = {
      ...flowState,
      nodes: flowState.nodes.map((node) => ({
        ...node,
        ports: null, // Set all node ports to null
      })),
      connections: [...flowState.connections],
      groups: [...flowState.groups],
    };

    return flowStateCopy;
  }

  public saveGraph(
    flowState: FlowModel,
    graph: GraphDto
  ): Observable<{
    graph: GraphDto;
    updatedNodes: {
      crewNodes: CrewNode[];
      pythonNodes: PythonNode[];
      llmNodes: any[];
      conditionalEdges: any[];
      edges: Edge[];
    };
  }> {
    //
    console.log('GraphUpdateService: Saving graph:', graph);
    console.log('GraphUpdateService: Flow state:', flowState);

    // Clear all ports on nodes before saving metadata
    const flowStateWithoutPorts = this.clearNodePorts(flowState);

    let deleteCrewNodes$: Observable<any> = of(null);
    if (graph.crew_node_list && graph.crew_node_list.length > 0) {
      const deleteCrewRequests = graph.crew_node_list.map(
        (crewNode: CrewNode) =>
          this.crewNodeService
            .deleteCrewNode(crewNode.id.toString())
            .pipe(catchError((err) => throwError(err)))
      );
      deleteCrewNodes$ = forkJoin(deleteCrewRequests);
    }

    const crewNodes$ = deleteCrewNodes$.pipe(
      switchMap(() => {
        const projectNodes = flowState.nodes.filter(
          (node) => node.type === NodeType.PROJECT
        ) as ProjectNodeModel[];
        const crewNodeRequests = projectNodes.map((node: ProjectNodeModel) => {
          const payload: CreateCrewNodeRequest = {
            node_name: node.node_name,
            graph: graph.id,
            crew_id: (node.data as GetProjectRequest).id,
            input_map: node.input_map || {},
            output_variable_path: node.output_variable_path || null,
          };
          return this.crewNodeService
            .createCrewNode(payload)
            .pipe(catchError((err) => throwError(err)));
        });
        return crewNodeRequests.length ? forkJoin(crewNodeRequests) : of([]);
      })
    );

    // ---- Handle Python Nodes ----
    let deletePythonNodes$: Observable<any> = of(null);
    if (graph.python_node_list && graph.python_node_list.length > 0) {
      const deletePythonRequests = graph.python_node_list.map(
        (pythonNode: PythonNode) =>
          this.pythonNodeService
            .deletePythonNode(pythonNode.id.toString())
            .pipe(catchError((err) => throwError(err)))
      );
      deletePythonNodes$ = forkJoin(deletePythonRequests);
    }

    const pythonNodes$ = deletePythonNodes$.pipe(
      switchMap(() => {
        const pythonNodes = flowState.nodes.filter(
          (node) => node.type === NodeType.PYTHON
        ) as PythonNodeModel[];
        const pythonNodeRequests = pythonNodes.map((node: PythonNodeModel) => {
          const payload: CreatePythonNodeRequest = {
            node_name: node.node_name,
            graph: graph.id,
            python_code: node.data,
            input_map: node.input_map || {},
            output_variable_path: node.output_variable_path || null,
          };
          return this.pythonNodeService
            .createPythonNode(payload)
            .pipe(catchError((err) => throwError(err)));
        });
        return pythonNodeRequests.length
          ? forkJoin(pythonNodeRequests)
          : of([]);
      })
    );

    // ---- Handle LLM Nodes ----
    let deleteLLMNodes$: Observable<any> = of(null);
    if (graph.llm_node_list && graph.llm_node_list.length > 0) {
      const deleteLLMRequests = graph.llm_node_list.map(
        (llmNode: GetLLMNodeRequest) =>
          this.llmNodeService
            .deleteLLMNode(llmNode.id.toString())
            .pipe(catchError((err) => throwError(err)))
      );
      deleteLLMNodes$ = forkJoin(deleteLLMRequests);
    }

    const llmNodes$ = deleteLLMNodes$.pipe(
      switchMap(() => {
        const llmNodes = flowState.nodes.filter(
          (node) => node.type === NodeType.LLM
        ) as LLMNodeModel[];
        const llmNodeRequests = llmNodes.map((node) => {
          const payload: CreateLLMNodeRequest = {
            node_name: node.node_name,
            graph: graph.id,
            llm_config: node.data.id,
            input_map: node.input_map || {},
            output_variable_path: node.output_variable_path || null,
          };
          return this.llmNodeService
            .createLLMNode(payload)
            .pipe(catchError((err) => throwError(err)));
        });
        return llmNodeRequests.length ? forkJoin(llmNodeRequests) : of([]);
      })
    );

    // ---- Handle Conditional Edges ----
    let deleteConditionalEdges$: Observable<any> = of(null);
    if (graph.conditional_edge_list && graph.conditional_edge_list.length > 0) {
      const deleteConditionalRequests = graph.conditional_edge_list.map(
        (condEdge: GetConditionalEdgeRequest) =>
          this.conditionalEdgeService
            .deleteConditionalEdge(condEdge.id)
            .pipe(catchError((err) => throwError(err)))
      );
      deleteConditionalEdges$ = forkJoin(deleteConditionalRequests);
    } else {
      deleteConditionalEdges$ = of(null);
    }

    const conditionalEdges$ = deleteConditionalEdges$.pipe(
      switchMap(() => {
        const edgeNodes = flowState.nodes.filter(
          (node) => node.type === NodeType.EDGE
        ) as EdgeNodeModel[];
        // Filter valid edge nodes based on existing connections.
        const validEdgeNodes = edgeNodes.filter((edgeNode) => {
          const connection = flowState.connections.find(
            (conn) => conn.targetNodeId === edgeNode.id
          );
          if (!connection) return false;
          return Boolean(
            flowState.nodes.find((n) => n.id === connection.sourceNodeId)
          );
        });
        const conditionalEdgeRequests = validEdgeNodes.map((edgeNode) => {
          const connection = flowState.connections.find(
            (conn) => conn.targetNodeId === edgeNode.id
          );
          const sourceNode = flowState.nodes.find(
            (n) => n.id === connection!.sourceNodeId
          );
          const payload: CreateConditionalEdgeRequest = {
            graph: graph.id,
            source: sourceNode ? sourceNode.node_name : null,
            then: null,
            python_code: edgeNode.data.python_code,
            input_map: edgeNode.input_map || {},
          };
          return this.conditionalEdgeService
            .createConditionalEdge(payload)
            .pipe(catchError((err) => throwError(err)));
        });
        return conditionalEdgeRequests.length
          ? forkJoin(conditionalEdgeRequests)
          : of([]);
      })
    );

    // ---- Handle Edge Connections ----
    let deleteEdges$: Observable<any> = of(null);
    console.log('before', graph.edge_list);

    if (graph.edge_list && graph.edge_list.length > 0) {
      const deleteEdgeRequests = graph.edge_list.map((edge: Edge) =>
        this.edgeService
          .deleteEdge(edge.id)
          .pipe(catchError((err) => throwError(err)))
      );
      deleteEdges$ = forkJoin(deleteEdgeRequests);
    }

    const createEdges$ = deleteEdges$.pipe(
      switchMap(() => {
        const validNodes = flowState.nodes;
        const validNodeIds = new Set(validNodes.map((n) => n.id));
        const edgeRequests = flowState.connections
          .filter((conn: ConnectionModel) => {
            if (
              !validNodeIds.has(conn.sourceNodeId) ||
              !validNodeIds.has(conn.targetNodeId)
            )
              return false;
            const sourceNode = flowState.nodes.find(
              (n) => n.id === conn.sourceNodeId
            );
            const targetNode = flowState.nodes.find(
              (n) => n.id === conn.targetNodeId
            );
            // Skip if source or target node is of type EDGE
            if (sourceNode && sourceNode.type === NodeType.EDGE) return false;
            if (targetNode && targetNode.type === NodeType.EDGE) return false;
            return true;
          })
          .map((conn) => {
            const sourceNode = flowState.nodes.find(
              (n) => n.id === conn.sourceNodeId
            );
            const targetNode = flowState.nodes.find(
              (n) => n.id === conn.targetNodeId
            );
            if (!sourceNode || !targetNode) return EMPTY;
            const payload: CreateEdgeRequest = {
              start_key: sourceNode.node_name,
              end_key: targetNode.node_name,
              graph: graph.id,
            };
            return this.edgeService
              .createEdge(payload)
              .pipe(catchError((err) => throwError(err)));
          });
        return edgeRequests.length ? forkJoin(edgeRequests) : of([]);
      })
    );
    console.log('before', graph.edge_list);

    // ---- Combine and Update Graph ----
    return forkJoin({
      crewNodes: crewNodes$,
      pythonNodes: pythonNodes$,
      llmNodes: llmNodes$,
      conditionalEdges: conditionalEdges$,
      edges: createEdges$,
    }).pipe(
      switchMap(
        (results: {
          crewNodes: CrewNode[];
          pythonNodes: PythonNode[];
          llmNodes: any[];
          conditionalEdges: any[];
          edges: Edge[];
        }) => {
          const updateGraphRequest: UpdateGraphDtoRequest = {
            id: graph.id,
            name: graph.name,
            description: graph.description,
            metadata: flowStateWithoutPorts,
          };
          console.log('sending this graph for update', updateGraphRequest);

          return this.graphService
            .updateGraph(graph.id, updateGraphRequest)
            .pipe(
              map((updatedGraph) => {
                console.log(
                  'GraphUpdateService: Graph updated successfully:',
                  updatedGraph
                );

                return {
                  graph: updatedGraph,
                  updatedNodes: {
                    crewNodes: results.crewNodes,
                    pythonNodes: results.pythonNodes,
                    llmNodes: results.llmNodes,
                    conditionalEdges: results.conditionalEdges,
                    edges: results.edges,
                  },
                };
              })
            );
        }
      ),
      catchError((err) => {
        return throwError(err);
      })
    );
  }
}

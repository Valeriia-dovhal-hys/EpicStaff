import {
  GetPythonCodeRequest,
  CreatePythonCodeRequest,
} from '../../../../../user-settings-page/tools/custom-tool-editor/models/python-code.model';

export interface PythonNode {
  id: number;
  node_name: string;
  graph: number;
  python_code: GetPythonCodeRequest;
  input_map: Record<string, any>;
  output_variable_path: string | null;
}

export interface CreatePythonNodeRequest {
  node_name: string;
  graph: number;
  python_code: CreatePythonCodeRequest;
  input_map: Record<string, any>;
  output_variable_path: string | null;
}

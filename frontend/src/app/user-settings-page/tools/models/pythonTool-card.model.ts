import { ArgsSchema } from '../custom-tool-editor/models/python-code-tool.model';
import { GetPythonCodeRequest } from '../custom-tool-editor/models/python-code.model';

export interface PythonCodeToolCard {
  id: number;
  python_code: GetPythonCodeRequest;
  name: string; // Required, minLength: 1
  description: string;
  args_schema: ArgsSchema; // Now an object rather than a JSON string
  label?: string;
  favorite?: boolean;
  enabled?: boolean;
}

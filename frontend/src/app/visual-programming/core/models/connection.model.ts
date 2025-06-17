import { CustomPortId } from './port.model';

export interface ConnectionModel {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePortId: CustomPortId;
  targetPortId: CustomPortId;
  startColor?: string;
  endColor?: string;
}

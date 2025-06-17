import { EventEmitter } from '@angular/core';

export interface INodeSidePanel {
  node: any;
  closePanel: EventEmitter<void>;
  nodeUpdated: EventEmitter<any>;
}

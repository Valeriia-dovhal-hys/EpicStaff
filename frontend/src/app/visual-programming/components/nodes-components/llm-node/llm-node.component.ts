import { Component, Input, signal } from '@angular/core';
import { GetLlmConfigRequest } from '../../../../shared/models/LLM_config.model';
import { NgFor, NgIf } from '@angular/common';
import { LLMNodeModel } from '../../../core/models/node.model';

@Component({
  selector: 'app-llm-node',
  imports: [],
  standalone: true,
  templateUrl: './llm-node.component.html',
  styleUrl: './llm-node.component.scss',
})
export class LlmNodeComponent {
  @Input() node!: LLMNodeModel;

  // Receive the parent's expanded signal to control the display of details.
  //   @Input() parentExpanded = signal(false);
}

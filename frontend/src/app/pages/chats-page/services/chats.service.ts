import { Injectable, signal, computed } from '@angular/core';
import { FullAgent } from '../../../services/full-agent.service';

@Injectable({
  providedIn: 'root',
})
export class ChatsService {
  private selectedAgent = signal<FullAgent | null>(null);

  readonly selectedAgentId$ = computed(() => this.selectedAgent()?.id || null);
  readonly selectedAgent$ = computed(() => this.selectedAgent());

  // Method to set selected agent (now takes full agent object)
  public setSelectedAgent(agent: FullAgent) {
    this.selectedAgent.set(agent);
  }
}

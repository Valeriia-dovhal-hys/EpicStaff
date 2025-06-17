import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { expandCollapseAnimation } from '../../../../../../shared/animations/animations-expand-collapse';
import { LLM_Provider } from '../../../../../../shared/models/LLM_provider.model';

import {
  ModelsPageService,
  ProviderTabType,
} from '../../services/models-page.service';
import { ProviderTabsComponent } from '../provider-tabs/provider-tabs.component';

@Component({
  selector: 'app-provider-item2',
  standalone: true,
  imports: [CommonModule, ProviderTabsComponent],
  template: `
    <div class="provider-container">
      <button
        class="provider-item"
        type="button"
        [class.expanded]="expanded()"
        (click)="toggleExpanded()"
      >
        <i class="ti ti-player-play-filled" [class.expanded]="expanded()"></i>
        <div class="provider-name">
          <img
            [src]="getProviderLogo()"
            [alt]="provider.name + ' logo'"
            class="provider-logo"
            [ngClass]="{ 'white-background': needsWhiteBackground() }"
          />
          {{ getDisplayName() }}
        </div>
      </button>

      <div
        class="animation-wrapper"
        [@expandCollapse]="expanded() ? 'expanded' : 'collapsed'"
      >
        <div class="provider-details">
          <app-provider-tabs2
            [provider]="provider"
            [activeTab]="modelsPageService.getActiveTab(provider.id)"
            (tabChange)="onTabChange($event)"
          ></app-provider-tabs2>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .provider-container {
        display: flex;
        flex-direction: column;
        border-radius: 0.375rem;
        overflow: hidden;

        .provider-item {
          padding: 10px 1rem;
          display: flex;
          align-items: center;
          transition: background-color 0.2s ease;
          cursor: pointer;
          background-color: var(--gray-800);
          border: none;
          width: 100%;
          text-align: left;
          border-radius: 0.375rem;

          &:hover {
            background-color: var(--gray-750);
          }

          &.expanded {
            background-color: var(--gray-750);
          }

          i {
            color: var(--gray-400);
            font-size: 0.6rem;
            margin-right: 1rem;
            transition: transform 0.2s ease;

            &.expanded {
              transform: rotate(90deg);
            }
          }

          .provider-name {
            font-weight: 500;
            font-size: 14px;
            color: #ededed;
            display: flex;
            align-items: center;
            gap: 16px;

            .provider-logo {
              width: 24px;
              height: 24px;
              object-fit: contain;

              &.white-background {
                background-color: white;
                border-radius: 4px;
                padding: 2px;
              }
            }

            .model-counts {
              font-size: 12px;
              color: var(--gray-400);
              font-weight: 400;
            }
          }
        }

        .animation-wrapper {
          overflow: hidden;
        }

        .provider-details {
          background-color: var(--gray-850);
          padding: 0.8rem;
          padding-top: 0.3rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapseAnimation],
})
export class ProviderItemComponent {
  public expanded = signal<boolean>(false);
  @Input() provider!: LLM_Provider;

  public modelsPageService = inject(ModelsPageService);
  private cdr = inject(ChangeDetectorRef);

  // Mapping of provider names to logo filenames
  private logoMap: Record<string, string> = {
    openai: 'openai-logo',
    ollama: 'ollama-logo',
    anthropic: 'claude-logo', // Using Claude logo for Anthropic
    azure_openai: 'azure-logo',
    groq: 'groq-logo',
    huggingface: 'huggingface-logo',
    openai_compatible: 'openai-compatible',
  };

  // Default logo to use if no mapping is found
  private defaultLogo = 'logo';

  public toggleExpanded() {
    this.expanded.update((value) => !value);

    // If expanding, sync with the service's expandedProviderId
    if (this.expanded()) {
      this.modelsPageService.setExpandedProvider(this.provider.id);
    } else if (
      this.modelsPageService.expandedProviderId() === this.provider.id
    ) {
      // Only reset if this provider is the one currently expanded in the service
      this.modelsPageService.setExpandedProvider(null);
    }
  }

  // Handle tab changes from the tabs component
  onTabChange(tabType: ProviderTabType) {
    this.modelsPageService.setActiveTab(this.provider.id, tabType);
  }

  // Get the appropriate logo URL for the provider
  getProviderLogo(): string {
    const logoName = this.logoMap[this.provider.name] || this.defaultLogo;
    return `assets/icons/${logoName}.svg`;
  }

  // Check if provider needs a white background for the logo
  needsWhiteBackground(): boolean {
    return ['ollama', 'openai_compatible'].includes(this.provider.name);
  }

  // Format the provider name for display (capitalize, replace underscores)
  getDisplayName(): string {
    return this.provider.name
      .replace('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LLM_Provider } from '../../../../../../features/settings-dialog/models/LLM_provider.model';
import { expandCollapseAnimation } from '../../../../../../shared/animations/animations-expand-collapse';
import { ProviderItemComponent } from '../provider-item/provider-item.component';
import { ModelsPageService } from '../../services/models-page.service';

@Component({
  selector: 'app-provider-list2',
  standalone: true,
  imports: [CommonModule, ProviderItemComponent],
  template: `
    <ul class="providers-items">
      @for (provider of providers(); track provider.id) {
      <li>
        <app-provider-item2 [provider]="provider"></app-provider-item2>
      </li>
      }
    </ul>
  `,
  styles: [
    `
      .providers-items {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px; /* Increased gap from 0.5rem to 1rem */
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapseAnimation],
})
export class ProviderListComponent {
  // Inject the service
  public modelsPageService = inject(ModelsPageService);

  providers = this.modelsPageService.providers;
}

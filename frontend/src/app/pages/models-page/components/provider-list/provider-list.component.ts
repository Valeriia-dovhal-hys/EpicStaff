import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LLM_Provider } from '../../../../shared/models/LLM_provider.model';
import { expandCollapseAnimation } from '../../../../shared/animations/animations-expand-collapse';
import { ProviderItemComponent } from '../provider-item/provider-item.component';
import { ModelsPageService } from '../../services/models-page.service';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, ProviderItemComponent],
  template: `
    <ul class="providers-items">
      @for (provider of providers(); track provider.id) {
      <li>
        <app-provider-item [provider]="provider"></app-provider-item>
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
        gap: 1rem; /* Increased gap from 0.5rem to 1rem */
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

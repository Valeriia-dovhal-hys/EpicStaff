import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-config-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="configs-cell-wrapper">
      <div *ngIf="!configs || configs.length === 0" class="no-configs">
        No configurations assigned
      </div>

      <div
        *ngFor="let config of configs"
        class="config-item"
        [ngClass]="config.type"
      >
        <img
          *ngIf="
            config.type === 'llm-config' || config.type === 'fcm-llm-config'
          "
          src="https://static.vecteezy.com/system/resources/thumbnails/021/059/825/small_2x/chatgpt-logo-chat-gpt-icon-on-green-background-free-vector.jpg"
          alt="LLM Logo"
          class="chatgpt-logo"
        />

        <img
          *ngIf="config.type === 'realtime-config'"
          src="https://cdn-icons-png.flaticon.com/512/6295/6295417.png"
          alt="Realtime Logo"
          class="realtime-logo"
        />

        <div class="item-content">
          <div class="item-text">
            {{ config.model_name }}
            <span *ngIf="config.custom_name" class="custom-name">
              ({{ config.custom_name }})
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .configs-cell-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 5px;
      height: 100%;
    }

    .config-item {
      display: flex;
      align-items: center;
      background-color: #2a2a2a;
      border-radius: 4px;
      padding: 8px;
      border: 1px solid #404040;
      transition: background-color 0.3s, border 0.3s;
      width: 100%;
    }

    .config-item:hover {
      background-color: #3a3a3a;
    }

    .chatgpt-logo,
    .realtime-logo {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      margin-right: 8px;
      border-radius: 4px;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .item-text {
      line-height: 1.3;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      max-width: 100%;
    }

    .custom-name {
      color: #aaa;
      margin-left: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-configs {
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      color: #aaa;
      font-style: italic;
      padding: 4px 8px;
      font-size: 0.8rem;
    }
  `,
})
export class ConfigCellRendererComponent implements ICellRendererAngularComp {
  //TO DO a separate model for merged Configs
  configs: any[] = [];

  agInit(params: ICellRendererParams): void {
    this.configs = params.value || [];
  }

  refresh(params: ICellRendererParams): boolean {
    this.configs = params.value || [];
    return true;
  }
}

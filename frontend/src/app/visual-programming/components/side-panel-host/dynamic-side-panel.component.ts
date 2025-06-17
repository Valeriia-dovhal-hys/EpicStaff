import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { NodeModel } from '../../core/models/node.model';
import { SIDE_PANEL_MAPPING } from '../../core/enums/side-panel-mapping';
import { ComponentType } from '@angular/cdk/portal';

@Component({
  selector: 'app-dynamic-side-panel-host',
  standalone: true,
  template: `<ng-container #panelContainer></ng-container>`,
  styles: [
    `
      :host {
        position: absolute;
        top: 1rem;
        bottom: 1rem;
        right: 1rem;
        z-index: 10001;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicSidePanelHostComponent implements OnChanges {
  @Input() node!: NodeModel;
  @Output() closePanel = new EventEmitter<void>();
  @Output() nodeUpdated = new EventEmitter<NodeModel>();

  @ViewChild('panelContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  public isExpanded = false;

  private componentRef?: ComponentRef<any>;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node'] && this.node) {
      this.loadSidePanel();
    }
  }

  private loadSidePanel(): void {
    this.container.clear();
    const component: ComponentType<any> | undefined =
      SIDE_PANEL_MAPPING[this.node.type];
    if (component) {
      this.componentRef = this.container.createComponent(component);

      this.componentRef.instance.node = this.node;

      // Subscribe to closePanel output
      if (this.componentRef.instance.closePanel) {
        this.componentRef.instance.closePanel.subscribe(() => {
          this.closePanel.emit();
          this.container.clear();
        });
      }

      // Subscribe to nodeUpdated output
      if (this.componentRef.instance.nodeUpdated) {
        this.componentRef.instance.nodeUpdated.subscribe(
          (updated: NodeModel) => {
            this.nodeUpdated.emit(updated);
            this.container.clear();
          }
        );
      }

      // Subscribe to nodeExpanded output
    } else {
      console.warn('No side panel mapped for node type:', this.node.type);
    }
  }
}

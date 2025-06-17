import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  HostListener,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { EFResizeHandleType, FFlowModule } from '@foblex/flow';
import { GroupNodeModel } from '../../core/models/group.model';
import { FlowService } from '../../services/flow.service';
import { GroupHeaderComponent } from './group-header/group-header.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { ColorPickerComponent } from './group-header/color-picker/color-picker.component';
import { ResizeHandleComponent } from '../resize-handle/resize-handle.component';

@Component({
  selector: 'app-group-node',
  standalone: true,
  imports: [
    CommonModule,
    FFlowModule,
    GroupHeaderComponent,
    ClickOutsideDirective,
    ColorPickerComponent,
    NgIf,
    ResizeHandleComponent,
  ],
  templateUrl: './group-node.component.html',
  styleUrl: './group-node.component.scss',
})
export class GroupNodeComponent implements OnInit, OnChanges {
  private _group!: GroupNodeModel;

  @Input({ required: true })
  public set group(value: GroupNodeModel) {
    this._group = value;

    // If the group becomes collapsed, close the color picker
    if (value.collapsed && this.showColorPicker) {
      this.showColorPicker = false;
    }
  }

  public get group(): GroupNodeModel {
    return this._group;
  }

  @Output() public rename = new EventEmitter<{ id: string; newName: string }>();
  @Output() public ungroup = new EventEmitter<string>();
  @Output() public toggleCollapsed = new EventEmitter<string>();
  @Output() public colorChanged = new EventEmitter<{
    id: string;
    backgroundColor: string;
  }>();

  // Default semi-transparent color: blue with 65% opacity
  private defaultColor: string = 'rgba(33, 150, 243, 0.65)';
  public currentTempColor: string = this.defaultColor;
  public isHovered = false;
  public showColorPicker = false;

  public readonly eResizeHandleType = EFResizeHandleType;

  @HostBinding('class.collapsed')
  public get isCollapsed(): boolean {
    return this.group?.collapsed || false;
  }

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    this.isHovered = true;
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this.isHovered = false;
  }

  constructor(public flowService: FlowService) {}

  ngOnInit(): void {
    // Initialize color from group if available
    this.initializeColor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if group property has changed
    if (changes['group']) {
      // If the group is collapsed, close the color picker
      const currentValue = changes['group'].currentValue as GroupNodeModel;
      if (currentValue?.collapsed && this.showColorPicker) {
        this.showColorPicker = false;
      }
    }
  }

  private initializeColor(): void {
    if (this.group && this.group.color) {
      this.currentTempColor = this.group.color;
    }
  }

  public toggleColorPicker(): void {
    this.showColorPicker = !this.showColorPicker;
    // Reset the temp color to the current group color when opening
    if (this.showColorPicker) {
      this.currentTempColor = this.group.color || this.defaultColor;
    }
  }

  public handleColorChange(color: string): void {
    // Update the temporary color and immediately apply it
    this.currentTempColor = color;
    this.colorChanged.emit({
      id: this.group.id,
      backgroundColor: this.currentTempColor,
    });
  }

  public closeColorPicker(): void {
    this.showColorPicker = false;
  }

  public onHeaderRenamed(newName: string): void {
    this.rename.emit({ id: this.group.id, newName });
  }

  public onUngroup(): void {
    this.ungroup.emit(this.group.id);
  }

  public onToggleCollapsed(): void {
    this.toggleCollapsed.emit(this.group.id);
    // Make sure color picker is closed when toggling collapsed state
    if (!this.group.collapsed) {
      this.showColorPicker = false;
    }
  }

  public handleClickOutside(event: Event): void {
    this.closeColorPicker();
  }

  // Getter for the group background color
  public get groupBackgroundColor(): string {
    return this.group?.backgroundColor || this.defaultColor;
  }
}

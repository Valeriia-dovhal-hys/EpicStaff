import { Component } from '@angular/core';
import { Tool } from '../../shared/models/tool.model';
import { ToolsService } from '../../services/tools.service';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [NgFor, MatIconModule, NgIf],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  public tools: Tool[] = [];
  public isFilterMenuOpen: boolean = false;
  constructor(private toolsService: ToolsService) {}

  ngOnInit(): void {
    this.toolsService.getTools().subscribe((tools: Tool[]) => {
      this.tools = tools;
    });
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }
}

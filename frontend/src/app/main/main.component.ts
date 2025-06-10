import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [],

  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent {}

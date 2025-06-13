// testtable.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-testtable',
  standalone: true,
  templateUrl: './testtable.component.html',
  styleUrls: ['./testtable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class TesttableComponent {
  text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

  showMore = false; // Controls toggle state
  displayedText = ''; // The text to display, truncated or full
  limit = 100; // Character limit for truncation
  ellipsis = '...'; // Ellipsis text

  ngOnInit(): void {
    this.updateDisplayedText();
  }

  toggleShowMore(): void {
    this.showMore = !this.showMore;
    this.updateDisplayedText();
  }

  private updateDisplayedText(): void {
    this.displayedText = this.showMore
      ? this.text
      : this.truncateText(this.text, this.limit);
  }

  private truncateText(text: string, limit: number): string {
    return text.length > limit ? text.slice(0, limit) + this.ellipsis : text;
  }
}

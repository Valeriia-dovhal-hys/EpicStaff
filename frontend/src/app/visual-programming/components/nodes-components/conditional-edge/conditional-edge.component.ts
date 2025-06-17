import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-conditional-edge-node',
  template: `
    <svg
      [attr.width]="width"
      [attr.height]="height"
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
    >
      <!-- Use a path to create a diamond with rounded corners -->
      <path
        [attr.d]="roundedDiamondPath"
        [attr.fill]="fillColor"
        [attr.stroke]="strokeColor"
        stroke-width="2"
      ></path>
      <!-- Place the icon and text inside the diamond -->
      <foreignObject
        [attr.x]="contentX"
        [attr.y]="contentY"
        [attr.width]="contentWidth"
        [attr.height]="contentHeight"
      >
        <div class="edge-content">
          <i class="ti ti-route-alt-left"></i>
          <span>Conditional Edge</span>
        </div>
      </foreignObject>
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      svg {
        overflow: visible;
      }
      .edge-content {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        font-size: 16px;
        color: #fff;

        i {
          transform: rotate(90deg);
          font-size: 25px;
          color: var(--edge-node-accent-color);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalEdgeNodeComponent {
  // Dynamic sizing inputs (you can override these from the parent)
  @Input() width: number = 300;
  @Input() height: number = 180;
  @Input() fillColor: string = 'var(--vp-node-color)';
  @Input() strokeColor: string = 'var(--vp-node-border-color)';
  @Input() cornerRadius: number = 10; // adjustable corner radius

  // Compute a rounded diamond path
  get roundedDiamondPath(): string {
    const w = this.width;
    const h = this.height;
    // Ensure the radius is not too large for the given dimensions
    const r = Math.min(this.cornerRadius, w / 2, h / 2);

    // Define the four diamond corner points
    const top = { x: w / 2, y: 0 };
    const right = { x: w, y: h / 2 };
    const bottom = { x: w / 2, y: h };
    const left = { x: 0, y: h / 2 };

    // Calculate offsets along the edges for the rounded corners.
    // Here we approximate by moving r units along the edge direction.
    // For the top corner:
    const topRightOffset = {
      x: top.x + (right.x - top.x) * (r / Math.hypot(w / 2, h / 2)),
      y: top.y + (right.y - top.y) * (r / Math.hypot(w / 2, h / 2)),
    };
    const topLeftOffset = {
      x: top.x + (left.x - top.x) * (r / Math.hypot(w / 2, h / 2)),
      y: top.y + (left.y - top.y) * (r / Math.hypot(w / 2, h / 2)),
    };

    // Similar approximations for the other corners:
    const rightTopOffset = {
      x: right.x + (top.x - right.x) * (r / Math.hypot(w / 2, h / 2)),
      y: right.y + (top.y - right.y) * (r / Math.hypot(w / 2, h / 2)),
    };
    const rightBottomOffset = {
      x: right.x + (bottom.x - right.x) * (r / Math.hypot(w / 2, h / 2)),
      y: right.y + (bottom.y - right.y) * (r / Math.hypot(w / 2, h / 2)),
    };

    const bottomRightOffset = {
      x: bottom.x + (right.x - bottom.x) * (r / Math.hypot(w / 2, h / 2)),
      y: bottom.y + (right.y - bottom.y) * (r / Math.hypot(w / 2, h / 2)),
    };
    const bottomLeftOffset = {
      x: bottom.x + (left.x - bottom.x) * (r / Math.hypot(w / 2, h / 2)),
      y: bottom.y + (left.y - bottom.y) * (r / Math.hypot(w / 2, h / 2)),
    };

    const leftBottomOffset = {
      x: left.x + (bottom.x - left.x) * (r / Math.hypot(w / 2, h / 2)),
      y: left.y + (bottom.y - left.y) * (r / Math.hypot(w / 2, h / 2)),
    };
    const leftTopOffset = {
      x: left.x + (top.x - left.x) * (r / Math.hypot(w / 2, h / 2)),
      y: left.y + (top.y - left.y) * (r / Math.hypot(w / 2, h / 2)),
    };

    // Build the path using quadratic curves for rounded corners.
    return `
      M ${topLeftOffset.x} ${topLeftOffset.y}
      Q ${top.x} ${top.y} ${topRightOffset.x} ${topRightOffset.y}
      L ${rightTopOffset.x} ${rightTopOffset.y}
      Q ${right.x} ${right.y} ${rightBottomOffset.x} ${rightBottomOffset.y}
      L ${bottomRightOffset.x} ${bottomRightOffset.y}
      Q ${bottom.x} ${bottom.y} ${bottomLeftOffset.x} ${bottomLeftOffset.y}
      L ${leftBottomOffset.x} ${leftBottomOffset.y}
      Q ${left.x} ${left.y} ${leftTopOffset.x} ${leftTopOffset.y}
      Z
    `;
  }

  // Center the foreignObject content
  get contentX(): number {
    return this.width * 0.18;
  }
  get contentY(): number {
    return this.height * 0.32;
  }
  get contentWidth(): number {
    return this.width * 0.64;
  }
  get contentHeight(): number {
    return this.height * 0.36;
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
  AfterViewInit,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SatValPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
})
export class ColorPickerComponent implements OnInit, AfterViewInit, OnChanges {
  @Input()
  set color(value: string) {
    if (value !== this._color) {
      this._color = value;
      this.updateColorValues(value);

      // If canvas is already initialized, update it
      if (this.canvasInitialized) {
        this.drawSatValCanvas();
        this.updateSatValPosition();
      }
    }
  }

  get color(): string {
    return this._color;
  }

  private _color: string = 'rgba(33, 150, 243, 0.65)';
  private canvasInitialized = false;

  @Output() colorChange = new EventEmitter<string>();

  @ViewChild('satValCanvas') satValCanvas!: ElementRef<HTMLCanvasElement>;

  // Color values
  hue: number = 0;
  saturation: number = 100;
  value: number = 100;
  alpha: number = 65; // Opacity percentage

  // Canvas interaction
  isDragging: boolean = false;
  satValPosition: SatValPosition = { x: 0, y: 0 };

  // Performance optimizations
  private isRequestingFrame: boolean = false;
  private canvasContext: CanvasRenderingContext2D | null = null;

  constructor(private ngZone: NgZone) {}

  // Get RGBA color
  get rgbaColor(): string {
    const { r, g, b } = this.hsvToRgb(
      this.hue / 360,
      this.saturation / 100,
      this.value / 100
    );
    return `rgba(${r}, ${g}, ${b}, ${this.alpha / 100})`;
  }

  ngOnInit(): void {
    // Extract color values from input
    this.updateColorValues(this.color);
    // Pre-calculate selector position
    this.calculateSelectorPosition();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color']) {
      this.updateColorValues(this.color);
      this.calculateSelectorPosition();
    }
  }

  ngAfterViewInit(): void {
    // Get canvas context once to avoid repeated calls
    this.canvasContext = this.satValCanvas.nativeElement.getContext('2d');

    // Draw the saturation/value canvas
    this.drawSatValCanvas();

    // Set the thumb position
    this.updateSatValPosition();

    // Mark as initialized
    this.canvasInitialized = true;
  }

  // Pre-calculate selector position before canvas is ready
  calculateSelectorPosition(): void {
    // Set initial position based on saturation/value
    this.satValPosition = {
      x: Math.round((this.saturation / 100) * 256),
      y: Math.round((1 - this.value / 100) * 256),
    };
  }

  // Parse color string to extract values
  updateColorValues(colorStr: string): void {
    // Handle rgba format
    if (colorStr.startsWith('rgba')) {
      const match = colorStr.match(
        /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/
      );
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        this.alpha = Math.round(parseFloat(match[4]) * 100);

        const hsv = this.rgbToHsv(r, g, b);
        this.hue = Math.round(hsv.h * 360);
        this.saturation = Math.round(hsv.s * 100);
        this.value = Math.round(hsv.v * 100);
        return;
      }
    }

    // Handle rgb format
    if (colorStr.startsWith('rgb')) {
      const match = colorStr.match(
        /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/
      );
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        this.alpha = 100;

        const hsv = this.rgbToHsv(r, g, b);
        this.hue = Math.round(hsv.h * 360);
        this.saturation = Math.round(hsv.s * 100);
        this.value = Math.round(hsv.v * 100);
        return;
      }
    }

    // Handle hex format
    if (colorStr.startsWith('#')) {
      const hex = colorStr.replace('#', '');
      if (hex.length === 6 || hex.length === 3) {
        let r, g, b;

        if (hex.length === 3) {
          // Expand shorthand hex
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        }

        this.alpha = 100;
        const hsv = this.rgbToHsv(r, g, b);
        this.hue = Math.round(hsv.h * 360);
        this.saturation = Math.round(hsv.s * 100);
        this.value = Math.round(hsv.v * 100);
        return;
      }
    }

    // Default to a color if parsing fails
    this.hue = 210; // Blue-ish
    this.saturation = 70;
    this.value = 80;
    this.alpha = 65;
  }

  // Convert RGB to HSV
  rgbToHsv(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h, s, v };
  }

  // Convert HSV to RGB
  hsvToRgb(
    h: number,
    s: number,
    v: number
  ): { r: number; g: number; b: number } {
    let r = 0,
      g = 0,
      b = 0;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  // Set alpha slider background to a simple gradient
  setAlphaSliderBackground(): string {
    const { r, g, b } = this.hsvToRgb(
      this.hue / 360,
      this.saturation / 100,
      this.value / 100
    );
    return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgb(${r}, ${g}, ${b}))`;
  }

  // Draw the saturation/value selection canvas
  drawSatValCanvas(): void {
    if (!this.satValCanvas || !this.canvasContext) return;

    const canvas = this.satValCanvas.nativeElement;
    const ctx = this.canvasContext;

    const width = canvas.width;
    const height = canvas.height;

    // Create an image data array
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Draw saturation/value gradient with current hue
    for (let y = 0; y < height; y++) {
      const value = 1 - y / height;

      for (let x = 0; x < width; x++) {
        const saturation = x / width;

        const rgb = this.hsvToRgb(this.hue / 360, saturation, value);

        const index = (y * width + x) * 4;
        data[index] = rgb.r; // R
        data[index + 1] = rgb.g; // G
        data[index + 2] = rgb.b; // B
        data[index + 3] = 255; // A (fully opaque)
      }
    }

    // Put the image data to the canvas in one operation
    ctx.putImageData(imageData, 0, 0);
  }

  // Update the position of the selector in the sat/val canvas
  updateSatValPosition(): void {
    if (!this.satValCanvas) return;

    const canvas = this.satValCanvas.nativeElement;

    // Calculate position based on current saturation and value
    this.satValPosition = {
      x: Math.round((this.saturation / 100) * canvas.width),
      y: Math.round((1 - this.value / 100) * canvas.height),
    };
  }

  // Handle sat/val canvas mouse down event
  onSatValMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.updateSatValFromEvent(event);
  }

  // Handle sat/val canvas mouse move event
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      // Use requestAnimationFrame to optimize performance
      if (!this.isRequestingFrame) {
        this.isRequestingFrame = true;

        this.ngZone.runOutsideAngular(() => {
          window.requestAnimationFrame(() => {
            this.ngZone.run(() => {
              this.updateSatValFromEvent(event);
              this.isRequestingFrame = false;
            });
          });
        });
      }
    }
  }

  // Handle mouse up event
  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  // Update saturation and value from mouse event
  updateSatValFromEvent(event: MouseEvent): void {
    if (!this.satValCanvas) return;

    const canvas = this.satValCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Calculate normalized coordinates (0-1)
    let x = (event.clientX - rect.left) / rect.width;
    let y = (event.clientY - rect.top) / rect.height;

    // Clamp values
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    // Update saturation and value
    this.saturation = Math.round(x * 100);
    this.value = Math.round((1 - y) * 100);

    // Update position
    this.satValPosition = {
      x: Math.round(x * canvas.width),
      y: Math.round(y * canvas.height),
    };

    // Emit color change
    this.updateColor();
  }

  // Handle hue slider changes
  onHueChange(event: Event): void {
    this.hue = parseInt((event.target as HTMLInputElement).value);
    this.drawSatValCanvas();
    this.updateColor();
  }

  // Handle alpha slider changes
  onAlphaChange(event: Event): void {
    this.alpha = parseInt((event.target as HTMLInputElement).value);
    this.updateColor();
  }

  // Update the color and emit change event
  updateColor(): void {
    const rgbaColor = this.rgbaColor;
    this._color = rgbaColor;
    this.colorChange.emit(rgbaColor);
  }
}

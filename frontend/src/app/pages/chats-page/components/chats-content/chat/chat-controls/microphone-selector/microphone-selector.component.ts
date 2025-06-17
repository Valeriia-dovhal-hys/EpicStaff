// microphone-selector.component.ts
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsoleService } from '../../../../../services/console.service';

const STORAGE_KEY_DEVICE_ID = 'selected_microphone_id';

@Component({
  selector: 'app-microphone-selector',
  templateUrl: './microphone-selector.component.html',
  styleUrls: ['./microphone-selector.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrophoneSelectorComponent implements OnInit {
  public showDevicesList = false;
  public selectedDeviceId = '';
  public isLoading = true;
  public hasDevices = false;

  constructor(
    public consoleService: ConsoleService,
    private cdr: ChangeDetectorRef
  ) {
    // Watch for changes in the loading state
    effect(() => {
      this.isLoading = this.consoleService.isLoadingDevices();
      this.cdr.markForCheck();
    });

    // Watch for changes in the devices list
    effect(() => {
      const devices = this.consoleService.audioDevices();
      this.hasDevices = devices.length > 0;

      if (this.hasDevices && !this.isLoading) {
        this.initializeDevice();
      }

      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // The initial device selection will be handled by the effect
  }

  private initializeDevice(): void {
    // If already initialized, don't do it again
    if (this.selectedDeviceId) return;

    // Try to get saved device
    const savedDeviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);

    if (savedDeviceId) {
      const savedDevice = this.audioInputDevices.find(
        (d) => d.deviceId === savedDeviceId
      );
      if (savedDevice) {
        this.selectedDeviceId = savedDevice.deviceId;
        return;
      }
    }

    // Use default or first device
    const defaultDevice = this.audioInputDevices.find(
      (d: any) => d.default === true
    );

    if (defaultDevice) {
      this.selectedDeviceId = defaultDevice.deviceId;
    } else if (this.audioInputDevices.length > 0) {
      this.selectedDeviceId = this.audioInputDevices[0].deviceId;
    }
  }

  public toggleDevicesList(event: Event): void {
    event.stopPropagation();

    // Only toggle if we have devices and they're loaded
    if (this.hasDevices && !this.isLoading) {
      this.showDevicesList = !this.showDevicesList;
      this.cdr.markForCheck();
    }
  }

  public selectDevice(deviceId: string): void {
    this.selectedDeviceId = deviceId;
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    this.showDevicesList = false;
    this.cdr.markForCheck();
  }

  public getSelectedDeviceLabel(): string {
    const selectedDevice = this.audioInputDevices.find(
      (d) => d.deviceId === this.selectedDeviceId
    );
    return selectedDevice?.label || 'Default microphone';
  }

  public get audioInputDevices(): MediaDeviceInfo[] {
    return this.consoleService
      .audioDevices()
      .filter((device) => device.kind === 'audioinput');
  }
}

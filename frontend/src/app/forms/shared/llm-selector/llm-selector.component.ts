import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FullLLMConfig } from '../../../services/full-llm-config.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { DropdownManagerService } from '../service/dropdown-manager.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../services/notifications/toast.service';

@Component({
  selector: 'app-llm-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './llm-selector.component.html',
  styleUrls: ['./llm-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LlmSelectorComponent),
      multi: true,
    },
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '150ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translateY(-10px)' })
        ),
      ]),
    ]),
  ],
})
export class LlmSelectorComponent
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() public llmConfigs: FullLLMConfig[] = [];
  @Input() public label: string = 'LLM Configuration';
  @Input() public placeholder: string = 'Select LLM Config';
  @Input() public required: boolean = false;
  @Input() public selectedValue: number | null = null;
  @Output() public valueChange = new EventEmitter<number | null>();

  public filteredConfigs: FullLLMConfig[] = [];
  public searchControl = new FormControl('');
  public isDisabled = false;
  public favorites: Set<number> = new Set();
  public isDropdownOpen = false;
  public showingFavoritesOnly: boolean = false;

  private dropdownId = 'llm-selector';
  private destroy$ = new Subject<void>();
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private dropdownManager: DropdownManagerService,
    private toastService: ToastService
  ) {}

  @HostListener('document:click', ['$event'])
  public clickOutside(event: MouseEvent): void {
    // Get the DOM element for the llm-selector-container
    const container = (event.target as HTMLElement).closest(
      '.llm-selector-container'
    );
    if (!container && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  public ngOnInit(): void {
    this.filteredConfigs = [...this.llmConfigs];

    // Initialize favorites from localStorage if available
    const savedFavorites = localStorage.getItem('llm-favorites');
    if (savedFavorites) {
      this.favorites = new Set(JSON.parse(savedFavorites));
    }

    this.searchControl.valueChanges.subscribe((value) => {
      this.filterConfigs(value || '');
    });

    // Subscribe to dropdown manager events
    this.dropdownManager.dropdownOpened$
      .pipe(takeUntil(this.destroy$))
      .subscribe((openedDropdownId) => {
        // Close this dropdown if another one opens
        if (openedDropdownId !== this.dropdownId && this.isDropdownOpen) {
          this.isDropdownOpen = false;
        }
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // Update internal state when selectedValue input changes
    if (changes['selectedValue']) {
      this.writeValue(this.selectedValue);
    }

    // Update filteredConfigs when llmConfigs changes
    if (changes['llmConfigs']) {
      this.filteredConfigs = [...this.llmConfigs];
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public toggleDropdown(event: Event): void {
    if (!this.isDisabled) {
      event.stopPropagation();

      const wasOpen = this.isDropdownOpen;
      this.isDropdownOpen = !this.isDropdownOpen;

      if (this.isDropdownOpen && !wasOpen) {
        // Notify other dropdowns to close
        this.dropdownManager.notifyDropdownOpened(this.dropdownId);
        this.onTouched();
      }
    }
  }

  public filterConfigs(value: string): void {
    const filterValue = value.toLowerCase();

    // Start with all configs or only favorites based on current filter
    const baseConfigs = this.showingFavoritesOnly
      ? this.llmConfigs.filter((config) => this.favorites.has(config.id))
      : this.llmConfigs;

    // Then apply search filter
    this.filteredConfigs = baseConfigs.filter(
      (config) =>
        config.custom_name.toLowerCase().includes(filterValue) ||
        config.modelDetails?.name.toLowerCase().includes(filterValue) ||
        false
    );
  }

  public writeValue(value: number | null): void {
    this.selectedValue = value;
  }

  public registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  public onSelectionChange(value: number | null): void {
    this.selectedValue = value;
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
    this.isDropdownOpen = false; // Close dropdown after selection
  }

  public toggleFavorite(event: Event, configId: number): void {
    event.stopPropagation();

    if (this.favorites.has(configId)) {
      this.favorites.delete(configId);
    } else {
      this.favorites.add(configId);
    }

    // Save to localStorage
    localStorage.setItem('llm-favorites', JSON.stringify([...this.favorites]));

    // If we're in favorites-only mode, refresh the filtered list
    if (this.showingFavoritesOnly) {
      this.showFavoritesOnly();
    }
  }

  public isFavorite(configId: number): boolean {
    return this.favorites.has(configId);
  }

  public showFavoritesOnly(): void {
    this.showingFavoritesOnly = !this.showingFavoritesOnly;

    if (this.showingFavoritesOnly) {
      this.filteredConfigs = this.llmConfigs.filter((config) =>
        this.favorites.has(config.id)
      );
    } else {
      // Return to showing all configs, but keep any search text filtering
      this.filterConfigs(this.searchControl.value || '');
    }
  }

  public resetFilters(): void {
    this.searchControl.setValue('');
    this.showingFavoritesOnly = false;
    this.filteredConfigs = [...this.llmConfigs];
  }

  public getSelectedConfigName(): string {
    const selectedConfig = this.llmConfigs.find(
      (config) => config.id === this.selectedValue
    );
    if (selectedConfig) {
      return `${selectedConfig.modelDetails?.name || 'Unknown Model'} - ${
        selectedConfig.custom_name
      }`;
    }
    return this.placeholder;
  }

  public onCreateLLMConfig(): void {
    this.toastService.info(`Feature not implemented yet`);
  }
}

import {
  Component,
  ChangeDetectionStrategy,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { FullEmbeddingConfig } from '../../../services/full-embedding.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { DropdownManagerService } from '../service/dropdown-manager.service';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../services/notifications/toast.service';

@Component({
  selector: 'app-embedding-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTooltipModule],
  templateUrl: './embedding-selector.component.html',
  styleUrls: ['./embedding-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmbeddingSelectorComponent),
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
export class EmbeddingSelectorComponent
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() public embeddingConfigs: FullEmbeddingConfig[] = [];
  @Input() public label: string = 'Embedding Configuration';
  @Input() public placeholder: string = 'Select Embedding Config';
  @Input() public required: boolean = false;
  @Input() public selectedValue: number | null = null;
  @Output() public valueChange = new EventEmitter<number | null>();

  public filteredConfigs: FullEmbeddingConfig[] = [];
  public searchControl = new FormControl('');
  public isDisabled = false;
  public favorites: Set<number> = new Set();
  public isDropdownOpen = false;
  public showingFavoritesOnly: boolean = false;

  private dropdownId = 'embedding-selector';
  private destroy$ = new Subject<void>();
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private dropdownManager: DropdownManagerService,
    private toastService: ToastService
  ) {}

  @HostListener('document:click', ['$event'])
  public clickOutside(event: MouseEvent): void {
    const container = (event.target as HTMLElement).closest(
      '.embedding-selector-container'
    );
    if (!container && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  public ngOnInit(): void {
    this.filteredConfigs = [...this.embeddingConfigs];

    const savedFavorites = localStorage.getItem('embedding-favorites');
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

    // Update filteredConfigs when embeddingConfigs changes
    if (changes['embeddingConfigs']) {
      this.filteredConfigs = [...this.embeddingConfigs];
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
      ? this.embeddingConfigs.filter((config) => this.favorites.has(config.id))
      : this.embeddingConfigs;

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

  public handleSelectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    // Convert to number or null
    this.onSelectionChange(value ? +value : null);
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
    localStorage.setItem(
      'embedding-favorites',
      JSON.stringify([...this.favorites])
    );

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
      this.filteredConfigs = this.embeddingConfigs.filter((config) =>
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
    this.filteredConfigs = [...this.embeddingConfigs];
  }

  public getSelectedConfigName(): string {
    const selectedConfig = this.embeddingConfigs.find(
      (config) => config.id === this.selectedValue
    );
    if (selectedConfig) {
      return `${selectedConfig.modelDetails?.name || 'Unknown Model'} - ${
        selectedConfig.custom_name
      }`;
    }
    return this.placeholder;
  }

  public onCreateEmbeddingConfig(): void {
    this.toastService.info(`Feature not implemented yet`);
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ViewContainerRef,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ProjectListItem } from '../models/project-list-item.model';
import { ProjectCardMenuComponent } from './sub-menu/project-card-sub-menu.component';
import {
  Overlay,
  OverlayModule,
  OverlayRef,
  OverlayPositionBuilder,
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { PortalModule, ComponentPortal } from '@angular/cdk/portal';
import { Subject, takeUntil } from 'rxjs';
import { ProjectMenuService } from './project-menu.service';
import { ToastService } from '../../../services/notifications/toast.service';
import { EMOJI_CATEGORIES } from '../../../shared/constants/emoji.constants';

@Component({
  selector: 'app-project-list-item-card',
  templateUrl: './project-list-item-card.component.html',
  styleUrl: './project-list-item-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, OverlayModule, PortalModule, NgClass],
})
export class ProjectListItemCardComponent implements OnInit, OnDestroy {
  @Input() project!: ProjectListItem;
  @Input() index: number = 0;

  @Output() startRun = new EventEmitter<ProjectListItem>();
  @Output() deleteProject = new EventEmitter<ProjectListItem>();
  @Output() openProject = new EventEmitter<number>();
  @Output() viewSessions = new EventEmitter<number>();
  @Output() copyProject = new EventEmitter<number>();
  @Output() toggleFavoriteStatus = new EventEmitter<ProjectListItem>();

  @ViewChild('menuTrigger', { static: false, read: ElementRef })
  menuTrigger!: ElementRef;

  public isMenuOpen = false;
  private projectEmoji: string = '';
  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private viewContainerRef: ViewContainerRef,
    private menuService: ProjectMenuService,
    private toastService: ToastService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen && this.overlayRef) {
      const clickTarget = event.target as HTMLElement;

      if (
        this.menuTrigger &&
        this.menuTrigger.nativeElement.contains(clickTarget)
      ) {
        return;
      }
      const overlayElement = this.overlayRef.overlayElement;
      if (overlayElement.contains(clickTarget)) {
        return;
      }

      this.closeMenu();
    }
  }

  ngOnInit(): void {
    this.projectEmoji = this.generateProjectEmoji();

    this.menuService.onCloseAllMenus
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isMenuOpen) {
          this.closeMenu();
        }
      });
  }

  private generateProjectEmoji(): string {
    return this.getEmojiByProjectId('technology');
  }

  private getEmojiByProjectId(category: keyof typeof EMOJI_CATEGORIES): string {
    const categoryEmojis = EMOJI_CATEGORIES[category];
    // Use project ID to ensure consistent emoji assignment
    const emojiIndex = this.project.id % categoryEmojis.length;
    return categoryEmojis[emojiIndex];
  }

  getProjectEmoji(): string {
    if (!this.projectEmoji) {
      this.projectEmoji = this.generateProjectEmoji();
    }
    return this.projectEmoji;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeMenu();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();

    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu(event);
    }
  }

  openMenu(event: MouseEvent): void {
    // Tell all other menus to close
    this.menuService.closeAllMenus();

    // Close any existing menu
    this.closeMenu();

    const positions: ConnectedPosition[] = [
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 8,
        offsetX: 19,
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        offsetY: -8,
      },
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 8,
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        offsetY: -8,
      },
    ];

    // Create position strategy
    const positionStrategy: FlexibleConnectedPositionStrategy =
      this.overlayPositionBuilder
        .flexibleConnectedTo(this.menuTrigger.nativeElement)
        .withPositions(positions)
        .withPush(true)
        .withViewportMargin(16);

    // Create the overlay without backdrop since we're using document:click
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: '220px',
      panelClass: 'project-card-menu-panel',
    });

    const portal = new ComponentPortal(
      ProjectCardMenuComponent,
      this.viewContainerRef
    );
    const componentRef = this.overlayRef.attach(portal);

    // Pass the data to the component instance
    componentRef.instance.project = this.project;

    componentRef.instance.deleteProject
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onDeleteProject();
        this.closeMenu();
      });

    componentRef.instance.copyProject
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onCopyProject();
        this.closeMenu();
      });

    componentRef.instance.toggleFavoriteStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toggleFavorite();
        this.closeMenu();
      });

    this.isMenuOpen = true;
    this.cdr.detectChanges();
  }

  closeMenu(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isMenuOpen = false;
    this.cdr.detectChanges();
  }

  onOpenProject(): void {
    this.openProject.emit(this.project.id);
  }

  onDeleteProject(): void {
    this.deleteProject.emit(this.project);
  }

  onCopyProject(): void {
    this.toastService.info(`Copy feature not implemented yet`);
    this.copyProject.emit(this.project.id);
  }

  toggleFavorite(): void {
    this.toastService.info(`Favorite start feature not implemented yet`);
    this.project.favorite = !this.project.favorite;
    this.toggleFavoriteStatus.emit(this.project);
  }
}

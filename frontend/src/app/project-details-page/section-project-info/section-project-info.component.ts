import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import { Project } from '../../shared/models/project.model';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { RunCrewSessionService } from '../../services/run-crew-session.service';
import { SharedSnackbarService } from '../../services/snackbar/shared-snackbar.service';
import { RunCrewSessionRequest } from '../../shared/models/RunCrewSession.model';
import { LLM_Config_Service } from '../../services/LLM_config.service';
import { LLM_Models_Service } from '../../services/LLM_models.service';
import { LLM_Config } from '../../shared/models/LLM_config.model';
import { LLM_Model } from '../../shared/models/LLM.model';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { EditProjectFormDialogComponent } from './edit-project-form-dialog/edit-project-form-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { EmbeddingModelsService } from '../../services/embeddings.service';
import { EmbeddingModel } from '../../shared/models/embedding.model';

@Component({
  selector: 'app-section-project-info',
  templateUrl: './section-project-info.component.html',
  styleUrls: ['./section-project-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

  standalone: true,
  imports: [NgIf, MatButtonModule, MatDialogModule, MatIconModule],
})
export class SectionProjectInfoComponent implements OnInit {
  @Input() project!: Project;

  @ViewChild('confirmRunDialog') confirmRunDialog!: TemplateRef<any>;
  confirmDialogRef!: MatDialogRef<any>;

  sessionId: number | null = null;

  llmModelData: LLM_Model | null = null;
  embeddingModelData: EmbeddingModel | null = null;
  configData: LLM_Config | null = null;

  dataLoaded = false;

  constructor(
    private dialog: MatDialog,
    private sharedSnackbarService: SharedSnackbarService,
    private runCrewSessionService: RunCrewSessionService,
    private llmConfigService: LLM_Config_Service,
    private llmModelsService: LLM_Models_Service,
    private embeddingModelsService: EmbeddingModelsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchProjectDetails();
  }

  fetchProjectDetails(): void {
    const llmModel$ = this.project.manager_llm_model
      ? this.llmModelsService.getLLMModelById(this.project.manager_llm_model)
      : of(null);

    const embeddingModel$ = this.project.embedding_model
      ? this.embeddingModelsService.getEmbeddingModelById(
          this.project.embedding_model
        )
      : of(null);

    const config$ = this.project.manager_llm_config
      ? this.llmConfigService.getConfigById(this.project.manager_llm_config)
      : of(null);

    forkJoin([llmModel$, embeddingModel$, config$]).subscribe({
      next: ([llmModel, embeddingModel, config]) => {
        this.llmModelData = llmModel;
        this.embeddingModelData = embeddingModel;
        this.configData = config;
        this.dataLoaded = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching project details:', error);
      },
    });
  }

  startRun(): void {
    this.confirmDialogRef = this.dialog.open(this.confirmRunDialog, {
      width: '400px',
      height: '180px',
      disableClose: true,
    });

    this.confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.runCrewSessionService.createSession(this.project.id).subscribe({
          next: (response: RunCrewSessionRequest) => {
            this.sessionId = response.session_id;
            this.sharedSnackbarService.showSnackbar(
              'Session started successfully!',
              'success'
            );
          },
          error: (error) => {
            console.error('Error creating session:', error);
            this.sharedSnackbarService.showSnackbar(
              'Failed to start session.',
              'error'
            );
          },
        });
      }
    });
  }
  openEditProjectDialog(): void {
    const dialogRef = this.dialog.open(EditProjectFormDialogComponent, {
      data: { project: this.project },
    });

    dialogRef.afterClosed().subscribe((updatedProject: Project | undefined) => {
      if (updatedProject) {
        this.project = updatedProject;
        this.fetchProjectDetails(); // Fetch updated related data
        this.cdr.markForCheck();
        this.sharedSnackbarService.showSnackbar(
          'Project updated successfully.',
          'success'
        );
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectModel } from 'src/app/models/project.model';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-view-page',
  templateUrl: './view-page.component.html',
  styleUrls: ['./view-page.component.css']
})
export class ViewPageComponent implements OnInit {

  public isLoading!: boolean;
  public errorMessage!: string;
  public project!: ProjectModel;
  public projectId!: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    this.projectId = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    this.loadProject();
  }

  loadProject(): void {
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (resObj) => {
        this.project = resObj;
        this.isLoading = false;
        console.log(this.project);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load project.';
        console.error('Error loading project:', error);
      }
    })
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
  getCompletedTasksCount(project: ProjectModel) {
    return project.tasks?.filter(task => task.isCompleted).length || 0;
  }
}

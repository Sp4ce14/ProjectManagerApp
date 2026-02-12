import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ProjectModel, TaskModel } from '../../models/project.model';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects: ProjectModel[] = [];
  expandedProjectId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load projects. Please try again.';
        console.error('Error loading projects:', error);
      }
    });
  }

  toggleProjectDetails(projectId: number | undefined): void {
    if (projectId === undefined) return;
    this.expandedProjectId = this.expandedProjectId === projectId ? null : projectId;
  }

  editProject(projectId: number | undefined): void {
    if (projectId === undefined) return;
    this.router.navigate(['/projects/edit', projectId]);
  }

  deleteProject(projectId: number | undefined): void {
    if (projectId === undefined) return;
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.loadProjects();
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete project. Please try again.';
        console.error('Error deleting project:', error);
      }
    });
  }

  addNewProject(): void {
    this.router.navigate(['/projects/add']);
  }

  getCompletedTasksCount(project: ProjectModel): number {
    return project.tasks?.filter(task => task.isCompleted).length || 0;
  }

  viewProject(projectId: number | undefined): void {
    this.router.navigate(['/projects/view', projectId])
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ClientModel, ProjectModel, TaskModel } from '../../models/project.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs';


@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  fetchedProjects: ProjectModel[] = [];
  displayProjects: ProjectModel[] = [];
  expandedProjectId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  clients: ClientModel[] = [];
  filterForm!: FormGroup;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadProjects();
    this.search();
  }

  applyFilter(): void {
    let queryParams = new HttpParams();
    if (this.filterForm.get('clientId')?.value) queryParams = queryParams.set('clientId', this.filterForm.get('clientId')?.value);
    if (this.filterForm.get('from')?.value) queryParams = queryParams.set('from', this.filterForm.get('from')?.value);       // string in YYYY-MM-DD format
    if (this.filterForm.get('to')?.value) queryParams = queryParams.set('to', this.filterForm.get('to')?.value);             // string in YYYY-MM-DD format
    if (this.filterForm.get('status')?.value) queryParams = queryParams.set('status', this.filterForm.get('status')?.value);         // convert boolean to string

    this.projectService.getFilteredProjects(queryParams).subscribe({
      next: projects => {
        this.fetchedProjects = projects;
        const query = this.filterForm.get('search')?.value?.toLowerCase() || '';
        this.displayProjects = query
          ? this.fetchedProjects.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.clientName?.toLowerCase().includes(query)
          ) : [...this.fetchedProjects]
      },
      error: () => {
        this.errorMessage = "Failed to apply Filter";
      }
    })
  }

  initializeForm(): void {
    this.filterForm = this.formBuilder.group({
      search: [null],
      clientId: [''],
      to: [null],
      from: [null],
      status: [null]
    })
  }

  loadClients(): void {
    this.projectService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: err => {
        this.errorMessage = "Failed to load clients.";
        console.log(err);
      }
    })
  }

  loadProjects(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const fromDate = new Date(today);
    fromDate.setDate(1);

    const toDate = new Date(year, month + 1, 0);

    const from = fromDate.toLocaleDateString('en-CA');
    const to = toDate.toLocaleDateString('en-CA');

    this.filterForm.patchValue({
      from: from,
      to: to
    })
    let queryParams = new HttpParams();
    if (this.filterForm.get('from')?.value) queryParams = queryParams.set('from', this.filterForm.get('from')?.value);       // string in YYYY-MM-DD format
    if (this.filterForm.get('to')?.value) queryParams = queryParams.set('to', this.filterForm.get('to')?.value);             // string in YYYY-MM-DD format
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.getFilteredProjects(queryParams).subscribe({
      next: (data) => {
        this.fetchedProjects = data;
        this.displayProjects = this.fetchedProjects;
        this.loadClients();
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

  search(): void {
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(input => {
        const query = input?.toLowerCase() || '';
        this.displayProjects = query
          ? this.fetchedProjects.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.clientName?.toLowerCase().includes(query)
           ) : [...this.fetchedProjects]
      });
  }
}

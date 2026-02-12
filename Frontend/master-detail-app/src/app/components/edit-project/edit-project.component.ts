import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TaskModel, ProjectModel, ClientModel } from '../../models/project.model';

@Component({
  selector: 'app-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {

  projectForm!: FormGroup;
  editPressed: boolean = false;
  editIndex!: number;
  tempTasks: TaskModel[] = [];
  projectId!: number;
  isTasksSectionOpen: boolean = true;
  isClientSectionOpen: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  clients: ClientModel[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.projectId = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    if (this.projectId) {
      this.loadProject();
    }
  }


  OnFileChange(event: any): void {
    let image: File = event.target.files[0];
    if (!image) return
    this.projectForm.patchValue({
      image: image
    })
    this.projectForm.get('image')?.updateValueAndValidity();
  }

  initializeForm(): void {
    this.projectForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      clientId: ['', [Validators.required]],
      clientEmail: ['', [Validators.required]],
      clientName: ['', [Validators.required]],
      deadline: ['', Validators.required],
      status: [false],
      image: [null, Validators.required],
      taskTitle: [''],
      taskAssignedUser: [''],
      taskDueDate: [''],
      taskIsCompleted: [false]
    });
  }

  loadProject(): void {
    this.isLoading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        console.log(project)
        this.tempTasks = project.tasks || [];

        // First, load clients
        this.getClients(project.clientId, project);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load project details.';
        console.error('Error loading project:', error);
      }
    });
  }

  getClients(selectedClientId: number | undefined, project?: ProjectModel): void {
    this.projectService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients; // include all clients
        // Patch the selected clientId
        if (selectedClientId) {
          this.projectForm.patchValue({
            clientId: selectedClientId
          });
        }
        // Also patch other project fields
        if (project) {
          const deadline = project.deadline.split('T')[0];
          this.projectForm.patchValue({
            name: project.name,
            deadline: deadline,
            status: project.status
          });
        }
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = "Failed to load clients.";
        this.isLoading = false;
        console.log(err);
      }
    });
  }


  toggleClientSection(): void {
    this.isClientSectionOpen = !this.isClientSectionOpen;
  }

  addNewClient(): void {
    const clientName = this.projectForm.get('clientName')?.value.trim();
    const clientEmail = this.projectForm.get('clientEmail')?.value.trim();
    if (!clientName || !clientEmail) {
      this.errorMessage = 'Please fill in both client name and email';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    let newClient: ClientModel = {
      name: clientName,
      email: clientEmail
    };
    console.log(newClient);
    this.projectService.createClient(newClient).subscribe({
      next: (clientResponse) => {
        console.log(clientResponse.id)
        newClient.id = clientResponse.id;
        this.clients.push(newClient);
        this.projectForm.patchValue({
          clientEmail: '',
          clientName: ''
        })
      },
      error: err => {
        this.errorMessage = 'Failed to create client. Please try again.';
        console.error('Error creating client:', err);
      }
    })
  }

  toggleTasksSection(): void {
    this.isTasksSectionOpen = !this.isTasksSectionOpen;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  updateTask(): void {
    if (!(this.projectForm.get('taskTitle')?.value?.trim() && this.projectForm.get('taskAssignedUser')?.value?.trim() && this.projectForm.get('taskDueDate')?.value)) return;
    this.tempTasks[this.editIndex].title = this.projectForm.get('taskTitle')?.value?.trim();
    this.tempTasks[this.editIndex].assignedUser = this.projectForm.get('taskAssignedUser')?.value?.trim();
    this.tempTasks[this.editIndex].dueDate = this.projectForm.get('taskDueDate')?.value;
    this.tempTasks[this.editIndex].isCompleted = this.projectForm.get('taskIsCompleted')?.value;
    this.resetTaskForm();
  }

  addTask(): void {
    const taskTitle = this.projectForm.get('taskTitle')?.value?.trim();
    const taskAssignedUser = this.projectForm.get('taskAssignedUser')?.value?.trim();
    const taskDueDate = this.projectForm.get('taskDueDate')?.value;

    if (!taskTitle || !taskAssignedUser || !taskDueDate) {
      this.errorMessage = 'Please fill in all task fields';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const newTask: TaskModel = {
      id: Number(Date.now()),
      title: taskTitle,
      assignedUser: taskAssignedUser,
      dueDate: taskDueDate,
      isCompleted: this.projectForm.get('taskIsCompleted')?.value || false
    };

    this.tempTasks.push(newTask);
    this.resetTaskForm();
    this.editPressed = !this.editPressed;
  }

  preLoadTask(taskId: any): void {
    console.log(this.tempTasks);
    let index = this.tempTasks.findIndex(t => t.id == taskId);
    if (index == null){
      this.errorMessage = "The task you are trying to edit doesn't exist.";
      return;
    }
    const dueDate = this.tempTasks[index].dueDate ? this.tempTasks[index].dueDate.split('T')[0] : '';
    this.projectForm.patchValue({
      taskTitle: this.tempTasks[index].title,
      taskAssignedUser: this.tempTasks[index].assignedUser,
      taskDueDate: dueDate,
      taskIsCompleted: this.tempTasks[index].isCompleted
    })
    this.editPressed = true;
    this.editIndex = index;
  }

  removeTask(taskId: any): void {
    let index = this.tempTasks.findIndex(t => t.id == taskId);
    if (index == null){
      this.errorMessage = "The task you are trying to delete doesn't exist.";
      return;
    }
    this.tempTasks.splice(index, 1);
  }

  toggleTaskCompletion(task: TaskModel): void {
    task.isCompleted = !task.isCompleted;
  }

  resetTaskForm(): void {
    this.projectForm.patchValue({
      taskTitle: '',
      taskAssignedUser: '',
      taskDueDate: '',
      taskIsCompleted: false
    });
    this.editPressed = !this.editPressed;
  }

  updateProject(): void {
    const imageControl = this.projectForm.get('image');
    const nameControl = this.projectForm.get('name');
    const deadlineControl = this.projectForm.get('deadline');
    const clientId = this.projectForm.get('clientId');

    if (!nameControl?.value?.trim() || !deadlineControl?.value || !clientId?.value) {
      this.errorMessage = 'Please fill in all required project fields';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isSubmitting = true;

    let formData = new FormData();
    formData.append('image', imageControl?.value);
    formData.append('name', nameControl.value.trim());
    formData.append('clientId', clientId.value);
    formData.append('deadline', deadlineControl.value);
    formData.append('status', this.projectForm.get('status')?.value);
    this.tempTasks.forEach((task, index) => {
      formData.append(`tasks[${index}].title`, task.title);
      formData.append(`tasks[${index}].assignedUser`, task.assignedUser);
      formData.append(`tasks[${index}].dueDate`, task.dueDate);
      formData.append(`tasks[${index}].isCompleted`, String(task.isCompleted));
    });

    this.projectService.updateProject(+this.projectId, formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Failed to update project. Please try again.';
        console.error('Error updating project:', error);
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      this.router.navigate(['/projects']);
    }
  }

}

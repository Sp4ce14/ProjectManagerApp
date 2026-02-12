import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TaskModel, ProjectModel, ClientModel } from '../../models/project.model';

@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {

  projectForm!: FormGroup;
  editPressed: boolean = false;
  editIndex!: number;
  tempTasks: TaskModel[] = [];
  isTasksSectionOpen: boolean = true;
  isClientSectionOpen: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  clients: ClientModel[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.getClients();
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

  OnFileChange(event: any): void {
    let image: File = event.target.files[0];
    if (!image) return
    this.projectForm.patchValue({
      image: image
    })
    this.projectForm.get('image')?.updateValueAndValidity();
  }

  getClients(): void {
    this.projectService.getClients().subscribe({
      next: (clients) => {
        for (let client of clients) {
          this.clients.push(client);
        }
      },
      error: err => {
        this.errorMessage = "Failed to load clients.";
        console.log(err);
      }
    })
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
    this.projectService.createClient(newClient).subscribe({
      next: (clientResponse) => {
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

  toggleTaskStatus(task: TaskModel): void {
    task.isCompleted = !task.isCompleted;

    // Update the project with the new task status
    const project: ProjectModel = {
      name: this.projectForm.get('name')?.value.trim(),
      deadline: this.projectForm.get('deadline')?.value,
      status: this.projectForm.get('status')?.value || false,
      tasks: this.tempTasks
    };
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

  saveProject(): void {
    const imageControl = this.projectForm.get('image');
    const nameControl = this.projectForm.get('name');
    const deadlineControl = this.projectForm.get('deadline');
    const clientId = this.projectForm.get('clientId');

    if (!nameControl?.value?.trim() || !deadlineControl?.value || !clientId?.value || !imageControl?.value) {
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

    this.projectService.createProject(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Failed to create project. Please try again.';
        console.log(error);
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      this.router.navigate(['/projects']);
    }
  }
}

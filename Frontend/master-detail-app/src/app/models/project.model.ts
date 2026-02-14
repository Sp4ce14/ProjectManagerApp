export interface TaskModel {
  id?: number | string;
  title: string;
  assignedUser: string;
  dueDate: string;
  isCompleted: boolean;
}

export interface ProjectModel {
  id?: number;
  name: string;
  deadline: string;
  clientId?: number;
  clientName?: string,
  status: boolean;
  imageUrl?: string;
  tasks?: TaskModel[];
}

export interface GetResponseModel {
  totalFoundRecords: number,
  projects: ProjectModel[] 
}

export interface ClientModel {
  id?: number;
  name?: string;
  email?: string;
}

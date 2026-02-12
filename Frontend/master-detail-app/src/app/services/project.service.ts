import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientModel, ProjectModel } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'https://localhost:7254/api/CRUD';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<ProjectModel[]> {
    return this.http.get<ProjectModel[]>(this.apiUrl + "/Projects").pipe(
      catchError(this.handleError)
    );
  }

  getImage(url: any): Observable<File> {
    return this.http.get<File>(url).pipe(
      catchError(this.handleError)
    );
  }

  getClients(): Observable<ClientModel[]> {
    return this.http.get<ClientModel[]>(this.apiUrl + "/Clients").pipe(
      catchError(this.handleError)
    );
  }

  getProjectById(id: string | number): Observable<ProjectModel> {
    return this.http.get<ProjectModel>(`${this.apiUrl}/Projects/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createProject(project: FormData): Observable<ProjectModel> {
    return this.http.post<ProjectModel>(this.apiUrl + "/Project", project).pipe(
      catchError(this.handleError)
    );
  }

  createClient(client: ClientModel): Observable<ClientModel> {
    return this.http.post<ClientModel>(this.apiUrl + "/Client", client).pipe(
      catchError(this.handleError)
    );
  }

  updateProject(id: number, project: FormData): Observable<ProjectModel> {
    return this.http.put<ProjectModel>(`${this.apiUrl}/${id}`, project).pipe(
      catchError(this.handleError)
    );
  }

  deleteProject(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { AddProjectComponent } from './components/add-project/add-project.component';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { ViewPageComponent } from './components/view-page/view-page.component';

@NgModule({
  declarations: [
    AppComponent,
    ProjectListComponent,
    AddProjectComponent,
    EditProjectComponent,
    ViewPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

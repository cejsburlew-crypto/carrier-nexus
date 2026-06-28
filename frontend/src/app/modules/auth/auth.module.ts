import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: LoginComponent },
      { path: 'hh', component: LoginComponent }  // Heavy Haulers branded login
    ])]
})
export class AuthModule {}

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UsersComponent } from './users.component';
import { CompaniesComponent } from './companies.component';
import { SettingsComponent } from './settings.component';
import { AiComponent } from './ai.component';

@NgModule({
  declarations: [UsersComponent,CompaniesComponent,SettingsComponent,AiComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'users', component: UsersComponent },{ path: 'companies', component: CompaniesComponent },{ path: 'settings', component: SettingsComponent },{ path: 'ai', component: AiComponent },
    { path: '', redirectTo: 'users', pathMatch: 'full' }
  ])]
})
export class AdminModule {}

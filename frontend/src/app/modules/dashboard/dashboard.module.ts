import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { FleetCommandComponent } from './fleet-command/fleet-command.component';

@NgModule({
  declarations: [DashboardComponent, FleetCommandComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: '', component: DashboardComponent },
    { path: 'fleet-command', component: FleetCommandComponent }
  ])]
})
export class DashboardModule {}

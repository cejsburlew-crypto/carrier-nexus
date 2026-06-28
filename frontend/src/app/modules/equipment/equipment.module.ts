import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EquipmentRegistryComponent } from './registry.component';
import { MaintenanceComponent } from './maintenance.component';
import { WorkOrdersComponent } from './work-orders.component';
import { PmScheduleComponent } from './pm-schedule.component';
import { PreTripComponent } from './pretrip.component';
import { TiresComponent } from './tires.component';
import { ScaleTicketsComponent } from './scale-tickets.component';
import { GpsTrackerComponent } from './gps.component';

@NgModule({
  declarations: [EquipmentRegistryComponent,MaintenanceComponent,WorkOrdersComponent,PmScheduleComponent,PreTripComponent,TiresComponent,ScaleTicketsComponent,GpsTrackerComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'registry',     component: EquipmentRegistryComponent },
    { path: 'search',       component: EquipmentRegistryComponent },
    { path: 'maintenance',  component: MaintenanceComponent },
    { path: 'work-orders',  component: WorkOrdersComponent },
    { path: 'pm-schedule',  component: PmScheduleComponent },
    { path: 'pretrip',      component: PreTripComponent },
    { path: 'tires',        component: TiresComponent },
    { path: 'scale-tickets',component: ScaleTicketsComponent },
    { path: 'gps',          component: GpsTrackerComponent },
    { path: 'marketplace',  component: EquipmentRegistryComponent },
    { path: '',             redirectTo: 'registry', pathMatch: 'full' }
  ])]
})
export class EquipmentModule {}

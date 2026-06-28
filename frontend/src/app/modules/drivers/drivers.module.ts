import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DriverRosterComponent } from './roster/driver-roster.component';
import { DriverProfileComponent } from './profile/driver-profile.component';
import { DriverPortalComponent } from './portal/driver-portal.component';
import { CoachingLogComponent } from './coaching/coaching-log.component';
import { DrugTestingComponent } from './drug-testing/drug-testing.component';
import { HallOfBraggingComponent } from './hall-of-bragging/hall-of-bragging.component';

@NgModule({
  declarations: [DriverRosterComponent, DriverProfileComponent, DriverPortalComponent, CoachingLogComponent, DrugTestingComponent, HallOfBraggingComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'roster',           component: DriverRosterComponent },
    { path: 'profile/:id',      component: DriverProfileComponent },
    { path: 'portal',           component: DriverPortalComponent },
    { path: 'coaching',         component: CoachingLogComponent },
    { path: 'drug-testing',     component: DrugTestingComponent },
    { path: 'hall-of-bragging', component: HallOfBraggingComponent },
    { path: 'my-pay',           component: DriverPortalComponent },
    { path: 'availability',     component: DriverRosterComponent },
    { path: '',                 redirectTo: 'roster', pathMatch: 'full' }
  ])]
})
export class DriversModule {}

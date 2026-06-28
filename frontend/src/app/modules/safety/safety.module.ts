import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HazardMapComponent } from './hazard-map.component';
import { RouteComponent } from './route.component';
import { ClaimsComponent } from './claims.component';
import { IncidentsComponent } from './incidents.component';
import { WeightCalcComponent } from './weight-calc.component';

@NgModule({
  declarations: [HazardMapComponent,RouteComponent,ClaimsComponent,IncidentsComponent,WeightCalcComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'hazard-map', component: HazardMapComponent },{ path: 'route', component: RouteComponent },{ path: 'claims', component: ClaimsComponent },{ path: 'incidents', component: IncidentsComponent },{ path: 'weight-calc', component: WeightCalcComponent },
    { path: '', redirectTo: 'hazard-map', pathMatch: 'full' }
  ])]
})
export class SafetyModule {}

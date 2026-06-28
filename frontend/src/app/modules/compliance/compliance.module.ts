import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FmcsaComponent } from './fmcsa.component';
import { DotComponent } from './dot.component';
import { CfrComponent } from './cfr.component';
import { ExpirationComponent } from './expiration.component';
import { PilotComponent } from './pilot.component';
import { AccidentsComponent } from './accidents.component';
import { DrugAlcoholComponent } from './drug-alcohol.component';
import { SosComponent } from './sos.component';
import { Boc3Component } from './boc3.component';
import { EntityComponent } from './entity.component';

@NgModule({
  declarations: [FmcsaComponent,DotComponent,CfrComponent,ExpirationComponent,PilotComponent,AccidentsComponent,DrugAlcoholComponent,SosComponent,Boc3Component,EntityComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'fmcsa', component: FmcsaComponent },{ path: 'dot', component: DotComponent },{ path: 'cfr', component: CfrComponent },{ path: 'expiration', component: ExpirationComponent },{ path: 'pilot', component: PilotComponent },{ path: 'accidents', component: AccidentsComponent },{ path: 'drug-alcohol', component: DrugAlcoholComponent },{ path: 'sos', component: SosComponent },{ path: 'boc3', component: Boc3Component },{ path: 'entity', component: EntityComponent },
    { path: '', redirectTo: 'fmcsa', pathMatch: 'full' }
  ])]
})
export class ComplianceModule {}

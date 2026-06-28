import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OverviewComponent } from './overview.component';
import { SettlementsComponent } from './settlements.component';
import { WeeklyComponent } from './weekly.component';
import { ExpensesComponent } from './expenses.component';
import { IftaComponent } from './ifta.component';
import { FuelComponent } from './fuel.component';
import { InvoicingComponent } from './invoicing.component';
import { FactoringComponent } from './factoring.component';
import { CommissionsComponent } from './commissions.component';
import { InsuranceComponent } from './insurance.component';

@NgModule({
  declarations: [OverviewComponent,SettlementsComponent,WeeklyComponent,ExpensesComponent,IftaComponent,FuelComponent,InvoicingComponent,FactoringComponent,CommissionsComponent,InsuranceComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'overview', component: OverviewComponent },{ path: 'settlements', component: SettlementsComponent },{ path: 'weekly', component: WeeklyComponent },{ path: 'expenses', component: ExpensesComponent },{ path: 'ifta', component: IftaComponent },{ path: 'fuel', component: FuelComponent },{ path: 'invoicing', component: InvoicingComponent },{ path: 'factoring', component: FactoringComponent },{ path: 'commissions', component: CommissionsComponent },{ path: 'insurance', component: InsuranceComponent },
    { path: '', redirectTo: 'overview', pathMatch: 'full' }
  ])]
})
export class FinancialsModule {}

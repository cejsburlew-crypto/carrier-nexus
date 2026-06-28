import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ShellComponent } from './shell.component';
import { SharedModule } from '../../shared/shared.module';
import { roleGuard } from '../../core/guards/auth.guard';

const routes: Routes = [{
  path: '',
  component: ShellComponent,
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard',    loadChildren: () => import('../dashboard/dashboard.module').then(m=>m.DashboardModule) },
    { path: 'dispatch',     loadChildren: () => import('../dispatch/dispatch.module').then(m=>m.DispatchModule) },
    { path: 'drivers',      loadChildren: () => import('../drivers/drivers.module').then(m=>m.DriversModule) },
    { path: 'equipment',    loadChildren: () => import('../equipment/equipment.module').then(m=>m.EquipmentModule) },
    { path: 'documents',    loadChildren: () => import('../documents/documents.module').then(m=>m.DocumentsModule) },
    { path: 'compliance',   loadChildren: () => import('../compliance/compliance.module').then(m=>m.ComplianceModule) },
    { path: 'financials',   loadChildren: () => import('../financials/financials.module').then(m=>m.FinancialsModule) },
    { path: 'communications',loadChildren: () => import('../communications/communications.module').then(m=>m.CommunicationsModule) },
    { path: 'safety',       loadChildren: () => import('../safety/safety.module').then(m=>m.SafetyModule) },
    { path: 'admin',        canActivate: [roleGuard(['admin'])], loadChildren: () => import('../admin/admin.module').then(m=>m.AdminModule) },
  ]
}];

@NgModule({
  declarations: [ShellComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)]
})
export class ShellModule {}

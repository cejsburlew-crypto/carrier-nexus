import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ActiveLoadsComponent } from './active-loads/active-loads.component';
import { DispatchBoardComponent } from './dispatch-board/dispatch-board.component';
import { LoadBoardComponent } from './load-board/load-board.component';

@NgModule({
  declarations: [ActiveLoadsComponent, DispatchBoardComponent, LoadBoardComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'active-loads',  component: ActiveLoadsComponent },
    { path: 'board',         component: DispatchBoardComponent },
    { path: 'pro',           component: DispatchBoardComponent },
    { path: 'load-board',    component: LoadBoardComponent },
    { path: '',              redirectTo: 'active-loads', pathMatch: 'full' }
  ])]
})
export class DispatchModule {}

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BoardComponent } from './board.component';
import { FeedComponent } from './feed.component';
import { ContactsComponent } from './contacts.component';
import { ConnectComponent } from './connect.component';

@NgModule({
  declarations: [BoardComponent,FeedComponent,ContactsComponent,ConnectComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'board', component: BoardComponent },{ path: 'feed', component: FeedComponent },{ path: 'contacts', component: ContactsComponent },{ path: 'connect', component: ConnectComponent },
    { path: '', redirectTo: 'board', pathMatch: 'full' }
  ])]
})
export class CommunicationsModule {}

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { VaultComponent } from './vault.component';
import { InboxComponent } from './inbox.component';
import { EmailScanComponent } from './email-scan.component';
import { UploadComponent } from './upload.component';
import { PodsComponent } from './pods.component';
import { PermitsComponent } from './permits.component';

@NgModule({
  declarations: [VaultComponent,InboxComponent,EmailScanComponent,UploadComponent,PodsComponent,PermitsComponent],
  imports: [SharedModule, RouterModule.forChild([
    { path: 'vault', component: VaultComponent },{ path: 'inbox', component: InboxComponent },{ path: 'email-scan', component: EmailScanComponent },{ path: 'upload', component: UploadComponent },{ path: 'pods', component: PodsComponent },{ path: 'permits', component: PermitsComponent },
    { path: '', redirectTo: 'vault', pathMatch: 'full' }
  ])]
})
export class DocumentsModule {}

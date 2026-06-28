import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  template: `
    <div class="nexus-shell">
      <app-sidebar></app-sidebar>
      <div class="nexus-main">
        <app-header></app-header>
        <main class="nexus-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .nexus-shell { display:flex; height:100vh; background:#0d1117; }
    .nexus-main  { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .nexus-content { flex:1; overflow-y:auto; padding:24px; }
  `]
})
export class ShellComponent {
  constructor(public auth: AuthService) {}
}

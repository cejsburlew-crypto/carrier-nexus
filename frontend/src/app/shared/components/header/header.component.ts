import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="nexus-header">
      <div class="header-left">
        <input class="global-search" type="text" placeholder="🔍  Search everything...">
      </div>
      <div class="header-right">
        <button class="icon-btn" title="Alerts">🔔</button>
        <button class="icon-btn" title="Feedback">💬</button>
        <span class="company-dot" [title]="auth.currentCompany?.name">
          DOT {{ auth.currentCompany?.dot }}
        </span>
        <span class="header-user">{{ auth.currentUser?.name }}</span>
      </div>
    </header>`,
  styles: [`
    .nexus-header { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; background:#161b22; border-bottom:1px solid #21262d; min-height:56px; }
    .global-search { background:#0d1117; border:1px solid #30363d; color:#e6edf3; border-radius:8px; padding:8px 16px; width:320px; font-size:13px; &:focus{outline:none;border-color:#e91e8c;} }
    .header-right { display:flex; align-items:center; gap:12px; }
    .icon-btn { background:none; border:none; font-size:16px; cursor:pointer; padding:4px; }
    .company-dot { background:rgba(233,30,140,.1); border:1px solid rgba(233,30,140,.2); color:#e91e8c; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; }
    .header-user { color:#8b949e; font-size:12px; }
  `]
})
export class HeaderComponent {
  constructor(public auth: AuthService) {}
}

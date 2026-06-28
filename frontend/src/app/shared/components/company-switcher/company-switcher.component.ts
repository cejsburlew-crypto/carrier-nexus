import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Company } from '../../../core/models';

@Component({
  selector: 'app-company-switcher',
  template: `
    <div class="switcher">
      <div class="current-co" (click)="open=!open">
        <div class="co-dot">DOT {{ auth.currentCompany?.dot }}</div>
        <div class="co-name">{{ auth.currentCompany?.name }}</div>
        <span class="chevron">{{ open ? '▴' : '▾' }}</span>
      </div>
      <div class="co-dropdown" *ngIf="open && companies.length > 1">
        <button *ngFor="let co of companies" class="co-option"
                [class.active]="co.id === auth.currentCompany?.id"
                (click)="switchTo(co.id)">
          <span class="co-dot-sm">DOT {{ co.dot }}</span>
          <span>{{ co.name }}</span>
        </button>
      </div>
    </div>`,
  styles: [`
    .switcher { position:relative; margin:8px; }
    .current-co { display:flex; flex-direction:column; background:#161b22; border:1px solid #30363d; border-radius:8px; padding:8px 10px; cursor:pointer; position:relative; &:hover{border-color:#e91e8c;} }
    .co-dot { font-size:9px; color:#e91e8c; font-weight:700; letter-spacing:.1em; }
    .co-name { font-size:12px; color:#e6edf3; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chevron { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#8b949e; font-size:10px; }
    .co-dropdown { position:absolute; top:100%; left:0; right:0; background:#161b22; border:1px solid #30363d; border-radius:8px; z-index:100; margin-top:4px; overflow:hidden; }
    .co-option { display:flex; flex-direction:column; width:100%; padding:8px 10px; background:none; border:none; color:#8b949e; cursor:pointer; text-align:left; font-size:11px; gap:2px; &:hover{background:#21262d;color:#e6edf3;} &.active{color:#e91e8c;} }
    .co-dot-sm { font-size:9px; font-weight:700; }
  `]
})
export class CompanySwitcherComponent implements OnInit {
  open = false;
  companies: Company[] = [];
  constructor(public auth: AuthService, private api: ApiService) {}
  ngOnInit() { this.api.get<Company[]>('companies').subscribe(r => { if (r.success && r.data) this.companies = r.data; }); }
  switchTo(id: number) { this.auth.switchCompany(id).subscribe(); this.open = false; }
}

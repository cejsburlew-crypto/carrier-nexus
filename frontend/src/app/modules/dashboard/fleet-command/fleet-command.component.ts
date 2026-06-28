import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({ template: `
  <div class="fc-header"><h1>🎯 Fleet Command</h1><p>Real-time operations overview</p></div>
  <div class="fc-grid">
    <div class="fc-panel"><h3>Active Loads</h3><div class="fc-val">{{ summary?.active_loads ?? '—' }}</div></div>
    <div class="fc-panel"><h3>Fleet Status</h3><div class="fc-val">{{ summary?.fleet_active ?? '—' }} / {{ summary?.fleet_total ?? '—' }}</div></div>
    <div class="fc-panel"><h3>Settlement Queue</h3><div class="fc-val">{{ summary?.settlements_pending ?? '—' }}</div></div>
    <div class="fc-panel"><h3>Open Work Orders</h3><div class="fc-val">{{ summary?.open_work_orders ?? '—' }}</div></div>
  </div>`,
  styles: [`.fc-header{margin-bottom:24px;h1{color:#e6edf3;font-size:22px;margin:0;}p{color:#8b949e;font-size:13px;}} .fc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;} .fc-panel{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;h3{color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;}} .fc-val{font-size:36px;font-weight:800;color:#e91e8c;}`]
})
export class FleetCommandComponent implements OnInit {
  summary: any = null;
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.get<any>('dashboard/fleet-command').subscribe(r => { if (r.success) this.summary = r.data; }); }
}

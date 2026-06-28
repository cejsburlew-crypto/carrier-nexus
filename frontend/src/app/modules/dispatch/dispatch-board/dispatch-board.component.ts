import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
@Component({ template:`<div class="page-wrap"><div class="page-header"><h1>📋 Dispatch Board</h1></div><div class="data-table-wrap"><div class="loading-state" *ngIf="loading">Loading…</div><table class="data-table" *ngIf="!loading"><thead><tr><th>Driver</th><th>Truck</th><th>Status</th><th>Current Load</th><th>Next Available</th></tr></thead><tbody><tr *ngFor="let d of drivers"><td>{{d.name}}</td><td>{{d.equipment_unit}}</td><td><span class="pill" [class]="d.status">{{d.status}}</span></td><td>{{d.current_load||'—'}}</td><td>{{d.next_available||'—'}}</td></tr></tbody></table></div></div>`, styleUrls:['../active-loads/active-loads.component.scss'] })
export class DispatchBoardComponent implements OnInit {
  drivers: any[] = []; loading = true;
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getPaged<any>('drivers',1,50).subscribe(r=>{ if(r.success && r.data) this.drivers=r.data.data; this.loading=false; }); }
}

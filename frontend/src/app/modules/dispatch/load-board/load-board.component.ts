import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
@Component({ template:`<div class="page-wrap"><div class="page-header"><h1>📌 Load Board</h1><button class="btn-primary" (click)="showForm=!showForm">+ Post Load</button></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Posted</th><th>Origin</th><th>Destination</th><th>Commodity</th><th>Rate</th><th>Weight</th><th>Action</th></tr></thead><tbody><tr *ngFor="let l of loads"><td>{{l.created_at|date:'MM/dd'}}</td><td>{{l.origin_city}}, {{l.origin_state}}</td><td>{{l.dest_city}}, {{l.dest_state}}</td><td>{{l.commodity}}</td><td class="money">{{l.rate|currency}}</td><td>{{l.weight|number}} lbs</td><td><button class="btn-primary" style="font-size:11px;padding:4px 10px">Assign</button></td></tr></tbody></table></div></div>`, styleUrls:['../active-loads/active-loads.component.scss'] })
export class LoadBoardComponent implements OnInit {
  loads: any[] = []; showForm = false;
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getPaged<any>('loads',1,50,{status:'pending'}).subscribe(r=>{ if(r.success && r.data) this.loads=r.data.data; }); }
}

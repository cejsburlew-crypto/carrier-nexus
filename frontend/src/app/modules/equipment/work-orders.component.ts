import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
@Component({ template:`<div class="page-wrap"><div class="page-header"><h1>WorkOrders</h1></div><div class="data-table-wrap"><div class="loading-state">Loading WorkOrders…</div></div></div>`, styleUrls:['../drivers/roster/driver-roster.component.scss'] })
export class WorkOrdersComponent implements OnInit {
  data: any[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() { /* Wire to api.get('work-orderss') */ }
}

import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
@Component({ template:`<div class="page-wrap"><div class="page-header"><h1>ScaleTickets</h1></div><div class="data-table-wrap"><div class="loading-state">Loading ScaleTickets…</div></div></div>`, styleUrls:['../drivers/roster/driver-roster.component.scss'] })
export class ScaleTicketsComponent implements OnInit {
  data: any[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() { /* Wire to api.get('scale-ticketss') */ }
}

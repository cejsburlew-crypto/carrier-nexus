import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Load, PagedResult } from '../../../core/models';

@Component({ templateUrl: './active-loads.component.html', styleUrls: ['./active-loads.component.scss'] })
export class ActiveLoadsComponent implements OnInit {
  loads: Load[] = [];
  total = 0; page = 1; perPage = 25;
  loading = true;
  showForm = false;
  statusFilter = '';

  newLoad = this.fb.group({
    rate_con_number:[''], broker_name:[''], driver_id:[null], origin_city:[''], origin_state:[''],
    dest_city:[''], dest_state:[''], pickup_date:[''], delivery_date:[''],
    commodity:[''], weight:[null], rate:[null], status:['pending'], notes:['']
  });

  constructor(private api: ApiService, private fb: FormBuilder) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getPaged<Load>('loads', this.page, this.perPage, this.statusFilter ? { status: this.statusFilter } : {})
      .subscribe(r => { if (r.success && r.data) { this.loads = r.data.data; this.total = r.data.total; } this.loading = false; });
  }

  save() {
    this.api.post<Load>('loads', this.newLoad.value).subscribe(r => { if (r.success) { this.showForm=false; this.load(); } });
  }

  updateStatus(id: number, status: string) {
    this.api.put(`loads/${id}`, { status }).subscribe(() => this.load());
  }
}

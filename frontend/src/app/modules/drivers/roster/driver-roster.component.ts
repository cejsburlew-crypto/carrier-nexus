import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Driver } from '../../../core/models';

@Component({ templateUrl: './driver-roster.component.html', styleUrls: ['./driver-roster.component.scss'] })
export class DriverRosterComponent implements OnInit {
  drivers: Driver[] = []; loading = true; showForm = false;
  newDriver = { name:'', email:'', phone:'', cdl_number:'', cdl_state:'', cdl_expiry:'', medical_expiry:'', hire_date:'', status:'active' };
  constructor(private api: ApiService, private router: Router) {}
  ngOnInit() { this.api.getPaged<Driver>('drivers',1,50).subscribe(r=>{ if(r.success && r.data) this.drivers=r.data.data; this.loading=false; }); }
  save() { this.api.post<Driver>('drivers', this.newDriver).subscribe(r=>{ if(r.success){ this.showForm=false; this.ngOnInit(); } }); }
  view(id:number) { this.router.navigate(['/drivers/profile', id]); }
  statusColor(s:string) { return {active:'green',on_load:'blue',available:'teal',in_shop:'yellow',inactive:'gray'}[s]||'gray'; }
}

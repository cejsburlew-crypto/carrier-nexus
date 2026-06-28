import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Driver } from '../../../core/models';
@Component({ template:`<div class="page-wrap"><div class="page-header"><h1>👤 Driver Profile</h1></div><div class="section-card" *ngIf="driver"><div class="form-grid"><div class="field"><label>Name</label><div class="val">{{driver.name}}</div></div><div class="field"><label>CDL</label><div class="val">{{driver.cdl_number}} ({{driver.cdl_state}})</div></div><div class="field"><label>CDL Expiry</label><div class="val" [class.expired]="isExpiring(driver.cdl_expiry)">{{driver.cdl_expiry|date:'MM/dd/yyyy'}}</div></div><div class="field"><label>Medical Expiry</label><div class="val" [class.expired]="isExpiring(driver.medical_expiry)">{{driver.medical_expiry|date:'MM/dd/yyyy'}}</div></div><div class="field"><label>Hire Date</label><div class="val">{{driver.hire_date|date:'MM/dd/yyyy'}}</div></div><div class="field"><label>Status</label><div class="val">{{driver.status}}</div></div></div></div></div>`, styles:[`@import '../../../../shared/styles/page'; .section-card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:24px;} .val{color:#e6edf3;font-size:14px;font-weight:600;} .expired{color:#f87171;}`] })
export class DriverProfileComponent implements OnInit {
  driver: Driver | null = null;
  constructor(private route: ActivatedRoute, private api: ApiService) {}
  ngOnInit() { const id = this.route.snapshot.paramMap.get('id'); if(id) this.api.get<Driver>(`drivers/${id}`).subscribe(r=>{ if(r.success) this.driver=r.data!; }); }
  isExpiring(date?: string): boolean { if(!date) return false; return new Date(date) < new Date(Date.now()+30*864e5); }
}

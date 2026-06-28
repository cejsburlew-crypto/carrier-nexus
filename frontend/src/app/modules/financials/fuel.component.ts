import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
@Component({ template:`<div class="page-wrap"><div class="page-header"><h1>Fuel</h1></div><div class="section-card"><p class="loading-state">Loading Fuel…</p></div></div>`, styles:['.page-wrap{max-width:1400px} .page-header{margin-bottom:24px} h1{color:#e6edf3;font-size:20px;font-weight:800;margin:0} .section-card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:24px} .loading-state{color:#8b949e;text-align:center;padding:32px}'] })
export class FuelComponent implements OnInit { constructor(private api: ApiService) {} ngOnInit() {} }

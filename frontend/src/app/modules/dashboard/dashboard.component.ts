import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface DashboardStats { active_loads:number; available_drivers:number; settlements_pending:number; revenue_week:number; expenses_week:number; net_week:number; expiring_docs:number; open_work_orders:number; }

@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentLoads: any[] = [];
  loading = true;

  constructor(private api: ApiService, public auth: AuthService) {}
  ngOnInit() {
    this.api.get<DashboardStats>('dashboard/stats').subscribe(r => { if (r.success) this.stats = r.data!; });
    this.api.getPaged<any>('loads', 1, 5, { status: 'in_transit' }).subscribe(r => { if (r.success) this.recentLoads = r.data!.data; this.loading = false; });
  }
}

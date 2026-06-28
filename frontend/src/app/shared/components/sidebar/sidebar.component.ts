import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

interface NavSection { label: string; icon: string; items: NavItem[]; roles?: string[]; }
interface NavItem    { label: string; route: string; icon: string; roles?: string[]; }

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  openSection: string | null = null;

  nav: NavSection[] = [
    { label: 'Operations', icon: '⚡', items: [
      { label: 'Dashboard',      route: '/dashboard',           icon: '🏠' },
      { label: 'Fleet Command',  route: '/dashboard/fleet-command', icon: '🎯' },
      { label: 'Active Loads',   route: '/dispatch/active-loads',icon: '🚛' },
      { label: 'Dispatch Board', route: '/dispatch/board',      icon: '📋' },
      { label: 'Dispatch PRO',   route: '/dispatch/pro',        icon: '⚡' },
      { label: 'Load Board',     route: '/dispatch/load-board', icon: '📌' },
    ]},
    { label: 'Drivers', icon: '👤', items: [
      { label: 'Driver Roster',    route: '/drivers/roster',      icon: '👥' },
      { label: 'Driver Portal',    route: '/drivers/portal',      icon: '📱' },
      { label: 'Availability',     route: '/drivers/availability', icon: '📅' },
      { label: 'Hall of Bragging', route: '/drivers/hall-of-bragging', icon: '🏆' },
      { label: 'Coaching Log',     route: '/drivers/coaching',    icon: '📝' },
      { label: 'Drug & Alcohol',   route: '/drivers/drug-testing',icon: '🧪' },
      { label: 'My Pay',           route: '/drivers/my-pay',      icon: '💰', roles: ['driver'] },
    ]},
    { label: 'Equipment', icon: '🔧', items: [
      { label: 'Fleet Registry',  route: '/equipment/registry',   icon: '🚛' },
      { label: 'Global Search',   route: '/equipment/search',     icon: '🔍' },
      { label: 'Maintenance',     route: '/equipment/maintenance',icon: '🔧' },
      { label: 'Work Orders',     route: '/equipment/work-orders',icon: '🗒️' },
      { label: 'PM Schedule',     route: '/equipment/pm-schedule',icon: '📆' },
      { label: 'Pre-Trip / DVIR', route: '/equipment/pretrip',   icon: '✅' },
      { label: 'Tire Intelligence',route: '/equipment/tires',     icon: '⚙️' },
      { label: 'Scale Tickets',   route: '/equipment/scale-tickets',icon: '⚖️' },
      { label: 'GPS Tracker',     route: '/equipment/gps',        icon: '📍' },
      { label: 'Marketplace',     route: '/equipment/marketplace',icon: '🛒' },
    ]},
    { label: 'Documents', icon: '📁', items: [
      { label: 'Document Vault',  route: '/documents/vault',      icon: '🗄️' },
      { label: 'Doc Inbox',       route: '/documents/inbox',      icon: '📥' },
      { label: 'Email Scanner',   route: '/documents/email-scan', icon: '📧' },
      { label: 'Upload',          route: '/documents/upload',     icon: '⬆️' },
      { label: 'Missing PODs',    route: '/documents/pods',       icon: '📦' },
      { label: 'Permits',         route: '/documents/permits',    icon: '📜' },
    ]},
    { label: 'Compliance', icon: '⚖️', items: [
      { label: 'FMCSA',           route: '/compliance/fmcsa',     icon: '🏛️' },
      { label: 'DOT Compliance',  route: '/compliance/dot',       icon: '🚦' },
      { label: '49 CFR Rules',    route: '/compliance/cfr',       icon: '📖' },
      { label: 'Expiration Hub',  route: '/compliance/expiration',icon: '⏰' },
      { label: 'Pilot Cars',      route: '/compliance/pilot',     icon: '🚗' },
      { label: 'Accident Register',route: '/compliance/accidents',icon: '🚨' },
      { label: 'Drug & Alcohol',  route: '/compliance/drug-alcohol',icon: '🧪' },
      { label: 'SOS/State',       route: '/compliance/sos',       icon: '🏛️' },
      { label: 'BOC-3',           route: '/compliance/boc3',      icon: '📋' },
      { label: 'Entity Compliance',route: '/compliance/entity',   icon: '🏢' },
    ]},
    { label: 'Financials', icon: '💵', items: [
      { label: 'P&L Overview',    route: '/financials/overview',  icon: '📊' },
      { label: 'Settlements',     route: '/financials/settlements',icon: '📑' },
      { label: 'Weekly Pay',      route: '/financials/weekly',    icon: '📅' },
      { label: 'Expenses',        route: '/financials/expenses',  icon: '💸' },
      { label: 'IFTA',            route: '/financials/ifta',      icon: '⛽' },
      { label: 'Fuel',            route: '/financials/fuel',      icon: '🔋' },
      { label: 'Invoicing',       route: '/financials/invoicing', icon: '🧾' },
      { label: 'Factoring',       route: '/financials/factoring', icon: '⚡' },
      { label: 'Commissions',     route: '/financials/commissions',icon: '💹' },
      { label: 'Insurance KPI',   route: '/financials/insurance', icon: '🛡️' },
    ]},
    { label: 'Communications', icon: '💬', items: [
      { label: 'Comm Board',      route: '/communications/board', icon: '📡' },
      { label: 'Road Book',       route: '/communications/feed',  icon: '📖' },
      { label: 'Contacts',        route: '/communications/contacts',icon: '👥' },
      { label: 'Nexus Connect',   route: '/communications/connect',icon: '🌐' },
    ]},
    { label: 'Safety & Route', icon: '🛡️', items: [
      { label: 'Hazard Map',      route: '/safety/hazard-map',    icon: '🗺️' },
      { label: 'Route Intelligence',route: '/safety/route',       icon: '🛣️' },
      { label: 'Claims',          route: '/safety/claims',        icon: '📋' },
      { label: 'Incidents',       route: '/safety/incidents',     icon: '⚠️' },
      { label: 'Weight Calc',     route: '/safety/weight-calc',   icon: '⚖️' },
    ]},
    { label: 'Admin', icon: '⚙️', roles: ['admin'], items: [
      { label: 'User Management', route: '/admin/users',          icon: '👤', roles: ['admin'] },
      { label: 'Companies',       route: '/admin/companies',      icon: '🏢', roles: ['admin'] },
      { label: 'Settings',        route: '/admin/settings',       icon: '⚙️', roles: ['admin'] },
      { label: 'AI Assistant',    route: '/admin/ai',             icon: '🤖' },
    ]},
  ];

  constructor(public auth: AuthService, private router: Router) {}
  ngOnInit() { this.openSection = this.nav[0].label; }

  toggle(section: string) { this.openSection = this.openSection === section ? null : section; }
  canSee(roles?: string[]): boolean { if (!roles) return true; return roles.includes(this.auth.currentUser?.role ?? ''); }
  logout() { this.auth.logout(); }
}

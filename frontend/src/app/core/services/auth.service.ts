import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthSession, User, Company, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessionSubject = new BehaviorSubject<AuthSession | null>(this.loadSession());
  session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): User | null { return this.sessionSubject.value?.user ?? null; }
  get currentCompany(): Company | null { return this.sessionSubject.value?.company ?? null; }
  get isLoggedIn(): boolean { return !!this.sessionSubject.value; }
  get token(): string | null { return this.sessionSubject.value?.token ?? null; }

  login(email: string, password: string): Observable<ApiResponse<AuthSession>> {
    return this.http.post<ApiResponse<AuthSession>>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => { if (res.success && res.data) this.setSession(res.data); })
    );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    localStorage.removeItem('nexus_v2_session');
    this.sessionSubject.next(null);
    this.router.navigate(['/login']);
  }

  switchCompany(companyId: number): Observable<ApiResponse<AuthSession>> {
    return this.http.post<ApiResponse<AuthSession>>(`${environment.apiUrl}/auth/switch-company`, { company_id: companyId }).pipe(
      tap(res => { if (res.success && res.data) this.setSession(res.data); })
    );
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem('nexus_v2_session', JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private loadSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem('nexus_v2_session');
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (new Date(session.expires_at) < new Date()) { localStorage.removeItem('nexus_v2_session'); return null; }
      return session;
    } catch { return null; }
  }
}

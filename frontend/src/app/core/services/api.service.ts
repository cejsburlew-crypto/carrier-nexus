import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string,any>): Observable<ApiResponse<T>> {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k,v]) => { if (v != null) p = p.set(k, String(v)); });
    return this.http.get<ApiResponse<T>>(`${this.base}/${path}`, { params: p });
  }

  getPaged<T>(path: string, page=1, perPage=25, filters?: Record<string,any>): Observable<ApiResponse<PagedResult<T>>> {
    return this.get<PagedResult<T>>(path, { page, per_page: perPage, ...filters });
  }

  post<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.base}/${path}`, body);
  }

  put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.base}/${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.base}/${path}`);
  }
}

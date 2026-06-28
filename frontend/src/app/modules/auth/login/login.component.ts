import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  loading = false;
  error = '';
  brand: 'ct' | 'hh' = 'ct';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private route: ActivatedRoute) {}
  ngOnInit() { if (this.auth.isLoggedIn) this.router.navigate(['/']); this.brand = this.route.snapshot.url[0]?.path === 'hh' ? 'hh' : 'ct'; }

  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: (res) => { this.loading = false; if (res.success) this.router.navigate(['/']); else this.error = res.message || 'Login failed'; },
      error: () => { this.loading = false; this.error = 'Connection error. Check your network.'; }
    });
  }
}

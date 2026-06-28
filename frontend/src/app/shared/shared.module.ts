import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { CompanySwitcherComponent } from './components/company-switcher/company-switcher.component';

@NgModule({
  declarations: [SidebarComponent, HeaderComponent, CompanySwitcherComponent],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  exports: [SidebarComponent, HeaderComponent, CompanySwitcherComponent, CommonModule, ReactiveFormsModule, FormsModule]
})
export class SharedModule {}

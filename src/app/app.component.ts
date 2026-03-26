import { Component, inject, signal, effect, Renderer2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CatDashboardPageComponent } from './features/cats/pages/cat-dashboard-page/cat-dashboard-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CatDashboardPageComponent,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private renderer = inject(Renderer2);

  readonly darkMode = signal(false);
  readonly currentYear = new Date().getFullYear();

  constructor() {
    this.titleService.setTitle('CatOps | Modern Cat Operations Dashboard');
    this.meta.updateTag({ name: 'description', content: 'CatOps is a modern dashboard for managing cats, tracking roster insights, and handling feline operations with a polished Material UI.' });
    this.meta.updateTag({ name: 'keywords', content: 'CatOps, cat dashboard, angular material ui, cat management, feline operations' });
    this.meta.updateTag({ name: 'theme-color', content: '#6b5bff' });
    this.meta.updateTag({ property: 'og:title', content: 'CatOps | Modern Cat Operations Dashboard' });
    this.meta.updateTag({ property: 'og:description', content: 'Manage cats, review quick insights, and keep the roster organized in a polished dashboard experience.' });

    // FIX: Wire dark mode signal to document — previously the button was dead
    effect(() => {
      if (this.darkMode()) {
        this.renderer.addClass(document.body, 'dark-theme');
        this.renderer.setAttribute(document.documentElement, 'data-theme', 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme');
        this.renderer.setAttribute(document.documentElement, 'data-theme', 'light');
      }
    });
  }

  toggleDark(): void {
    this.darkMode.update(v => !v);
  }
}

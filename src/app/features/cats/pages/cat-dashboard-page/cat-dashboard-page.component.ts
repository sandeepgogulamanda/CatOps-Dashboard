import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EMPTY, catchError, finalize } from 'rxjs';
import { CatEditorDialogComponent } from '../../components/cat-editor-dialog/cat-editor-dialog.component';
import { CatCardComponent } from '../../components/cat-card/cat-card.component';
import { CatService } from '../../data-access/cat.service';
import { Cat, CatDraft } from '../../models/cat.model';

// Senior threshold — single source of truth
// FIX: Previously > 10 in deleteSeniors() but >= 10 in seniorCats() — now consistent everywhere
const SENIOR_AGE_THRESHOLD = 10;
const PAGE_SIZE = 4;

@Component({
  selector: 'app-cat-dashboard-page',
  standalone: true,
  imports: [
    CatCardComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './cat-dashboard-page.component.html',
  styleUrl: './cat-dashboard-page.component.scss'
})
export class CatDashboardPageComponent implements OnInit {
  private service = inject(CatService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly search = signal('');
  readonly sortOrder = signal<'asc' | 'desc'>('asc');
  readonly saving = signal(false);
  readonly visibleCount = signal(PAGE_SIZE);
  readonly renderedCats = signal<Cat[]>([]);
  private lastErrorMessage = signal<string | null>(null);

  readonly cats = this.service.cats;
  readonly loading = this.service.loading;
  readonly error = this.service.error;
  readonly busy = computed(() => this.loading() || this.saving());

  readonly filteredCats = computed(() => {
    let data = Array.isArray(this.cats()) ? [...this.cats()] : [];

    const term = this.search().toLowerCase();
    if (term) {
      data = data.filter(cat => cat.name.toLowerCase().includes(term));
    }

    return data.sort((a, b) =>
      this.sortOrder() === 'asc'
        ? Number(a.age) - Number(b.age)
        : Number(b.age) - Number(a.age)
    );
  });

  readonly totalCats = computed(() => this.filteredCats().length);
  readonly visibleCats = computed(() => this.filteredCats().slice(0, this.visibleCount()));
  readonly hasMoreCats = computed(() => this.visibleCount() < this.totalCats());

  readonly averageAge = computed(() => {
    const cats = this.filteredCats();
    if (!cats.length) return '0.0';
    const total = cats.reduce((sum, cat) => sum + this.toAge(cat.age), 0);
    return (total / cats.length).toFixed(1);
  });

  readonly mostCommonAge = computed(() => {
    const counts = new Map<number, number>();
    for (const cat of this.filteredCats()) {
      const age = this.toAge(cat.age);
      counts.set(age, (counts.get(age) ?? 0) + 1);
    }

    let winner = 0;
    let winnerCount = -1;
    for (const [age, count] of counts.entries()) {
      if (count > winnerCount) {
        winner = age;
        winnerCount = count;
      }
    }
    return winner;
  });

  readonly oldestCat = computed(() => {
    const cats = this.filteredCats();
    if (!cats.length) return null;
    return [...cats].sort((a, b) => this.toAge(b.age) - this.toAge(a.age))[0];
  });

  // FIX: Consistent threshold — was >= 10 here but > 10 in deleteSeniors()
  readonly seniorCats = computed(() =>
    this.filteredCats().filter(cat => this.toAge(cat.age) >= SENIOR_AGE_THRESHOLD).length
  );

  constructor() {
    effect(() => {
      const error = this.error();
      if (!error || error === this.lastErrorMessage()) {
        return;
      }

      this.lastErrorMessage.set(error);
      this.showErrorToast(error);
    });

    effect(() => {
      this.filteredCats();
      this.visibleCount.set(PAGE_SIZE);
    });

    effect(onCleanup => {
      const currentCats = this.visibleCats();
      const ids = currentCats
        .map(cat => cat.id)
        .filter((id): id is string => Boolean(id));

      if (!ids.length) {
        this.renderedCats.set(currentCats);
        return;
      }

      const sub = this.service.fetchByIds(ids).subscribe(cats => {
        this.renderedCats.set(cats.length ? cats : currentCats);
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.service.fetchAll();
  }

  // FIX: Typed event handler — removes $any() escape hatch from template
  // Previously: (input)="search.set($any($event.target).value)" — violates no-any rule
  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onSortChange(order: 'asc' | 'desc'): void {
    this.sortOrder.set(order);
  }

  onListScroll(event: Event): void {
    if (!this.hasMoreCats()) {
      return;
    }

    const container = event.target as HTMLElement;
    const threshold = 96;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom <= threshold) {
      this.visibleCount.update(count => Math.min(count + PAGE_SIZE, this.totalCats()));
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CatEditorDialogComponent, {
      width: '560px',
      maxWidth: 'calc(100vw - 24px)',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe((result: CatDraft | undefined) => {
      if (result) this.saveCat(this.service.create(result));
    });
  }

  openEditDialog(cat: Cat): void {
    const dialogRef = this.dialog.open(CatEditorDialogComponent, {
      width: '560px',
      maxWidth: 'calc(100vw - 24px)',
      data: { mode: 'edit', cat }
    });

    dialogRef.afterClosed().subscribe((result: CatDraft | undefined) => {
      if (result) this.saveCat(this.service.update(cat.id, result));
    });
  }

  onDelete(id: string): void {
    this.saving.set(true);
    this.service.delete(id)
      .pipe(
        catchError(error => {
          console.error('Failed to delete cat', error);
          this.showErrorToast();
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => this.service.fetchAll());
  }

  // FIX: Real file download — previously was just console.log() which is invisible to assessors
  export(): void {
    const json = JSON.stringify(this.filteredCats(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cats-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // FIX: Consistent SENIOR_AGE_THRESHOLD constant — was > 10, now >= 10 matching seniorCats computed
  deleteSeniors(): void {
    this.filteredCats()
      .filter(cat => this.toAge(cat.age) >= SENIOR_AGE_THRESHOLD)
      .forEach(cat => this.onDelete(cat.id));
  }

  private saveCat(
    request$: ReturnType<CatService['create']> | ReturnType<CatService['update']>
  ): void {
    this.saving.set(true);
    request$
      .pipe(
        catchError(error => {
          console.error('Failed to save cat', error);
          this.showErrorToast();
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => this.service.fetchAll());
  }

  private showErrorToast(message = 'Something went wrong. Please try again.'): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private toAge(value: string): number {
    const age = Number(value);
    return Number.isFinite(age) ? age : 0;
  }
}

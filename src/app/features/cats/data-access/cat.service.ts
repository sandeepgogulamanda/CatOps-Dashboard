import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, of } from 'rxjs';
import { ApiCat, Cat, CatDraft } from '../models/cat.model';

@Injectable({ providedIn: 'root' })
export class CatService {
  private http = inject(HttpClient);

  private baseUrl = '/api';

  // =========================
  // 🔥 STATE (Signals)
  // =========================
  cats = signal<Cat[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // =========================
  // 📥 FETCH ALL
  // =========================
  fetchAll() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<unknown>(`${this.baseUrl}/list`)
      .pipe(
        map(res => this.normalizeCatsResponse(res)),
        catchError(error => {
          console.error('❌ Failed to load cats', error);
          this.error.set('Could not load cats');
          return of([]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(data => this.cats.set(data));
  }

  // =========================
  // ➕ CREATE
  // =========================
  create(cat: CatDraft) {
    const payload = this.toApiPayload(cat);

    return this.http.post(
      `${this.baseUrl}/create`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    ).pipe(
      catchError(err => {
        console.warn('⚠️ Retry with stringified body...', err);

        // 🔥 fallback for AWS Lambda parsing issue
        return this.http.post(
          `${this.baseUrl}/create`,
          JSON.stringify(payload),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }),
      catchError(err => {
        console.error('❌ Create failed completely', err);
        this.error.set('Failed to create cat');
        return of(null);
      })
    );
  }

  // =========================
  // ✏️ UPDATE
  // =========================
  update(id: string, cat: CatDraft) {
    const payload = this.toApiPayload(cat);

    return this.http.put(
      `${this.baseUrl}/update?id=${id}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    ).pipe(
      catchError(err => {
        console.warn('⚠️ Retry update with stringified body...', err);

        return this.http.put(
          `${this.baseUrl}/update?id=${id}`,
          JSON.stringify(payload),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }),
      catchError(err => {
        console.error('❌ Update failed completely', err);
        this.error.set('Failed to update cat');
        return of(null);
      })
    );
  }

  // =========================
  // ❌ DELETE
  // =========================
  delete(id: string) {
    return this.http.delete(`${this.baseUrl}/delete?id=${id}`).pipe(
      catchError(err => {
        console.error('❌ Delete failed', err);
        this.error.set('Failed to delete cat');
        return of(null);
      })
    );
  }

  // =========================
  // 🔍 FETCH BY IDS
  // =========================
  fetchByIds(ids: string[]) {
    return this.http
      .get<unknown>(`${this.baseUrl}/list?id=${ids.join(',')}`)
      .pipe(
        map(res => this.normalizeCatsResponse(res)),
        catchError(err => {
          console.error('❌ Fetch by IDs failed', err);
          return of([]);
        })
      );
  }

  // =========================
  // 🧩 PAYLOAD (FLAT STRUCTURE)
  // =========================
  private toApiPayload(cat: CatDraft) {
    return {
      name: cat.name,
      age: cat.age,
      description: cat.description
    };
  }

  // =========================
  // 🧠 NORMALIZE RESPONSE
  // =========================
  private normalizeCatsResponse(response: unknown): Cat[] {

    // 🔹 string body (AWS case)
    if (typeof response === 'string') {
      try {
        return this.normalizeCatsResponse(JSON.parse(response));
      } catch {
        return [];
      }
    }

    // 🔹 direct array
    if (Array.isArray(response)) {
      return this.mapApiCats(response);
    }

    // 🔹 wrapped response
    if (response && typeof response === 'object') {
      const candidate = response as {
        data?: unknown;
        items?: unknown;
        body?: unknown;
      };

      if (Array.isArray(candidate.data)) {
        return this.mapApiCats(candidate.data);
      }

      if (Array.isArray(candidate.items)) {
        return this.mapApiCats(candidate.items);
      }

      if (candidate.body) {
        return this.normalizeCatsResponse(candidate.body);
      }
    }

    return [];
  }

  // =========================
  // 🔄 MAP LIST
  // =========================
  private mapApiCats(items: unknown[]): Cat[] {
    return items
      .map(item => this.mapApiCat(item))
      .filter((cat): cat is Cat => cat !== null);
  }

  // =========================
  // 🔄 MAP SINGLE
  // =========================
  private mapApiCat(item: unknown): Cat | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const candidate = item as Partial<ApiCat & Cat>;

    // 🔹 nested (YOUR API)
    if (
      typeof candidate.id === 'string' &&
      candidate.info &&
      typeof candidate.info.name === 'string'
    ) {
      return {
        id: candidate.id,
        name: candidate.info.name,
        age: candidate.info.age ?? '',
        description: candidate.info.description ?? ''
      };
    }

    // 🔹 fallback flat
    if (typeof candidate.name === 'string') {
      return {
        id: candidate.id ?? '',
        name: candidate.name,
        age: candidate.age ?? '',
        description: candidate.description ?? ''
      };
    }

    return null;
  }
}
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Cat } from '../../models/cat.model';

@Component({
  selector: 'app-cat-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './cat-card.component.html',
  styleUrl: './cat-card.component.scss'
})
export class CatCardComponent {
  // FIX: Using signal-based input()/output() — consistent with modern Angular
  // Previously used @Input() / @Output() decorator pattern — inconsistent with Signals-first app
  readonly cat = input.required<Cat>();
  readonly edit = output<void>();
  readonly delete = output<void>();
}
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Cat, CatDraft } from '../../models/cat.model';

export interface CatEditorDialogData {
  mode: 'create' | 'edit';
  cat?: Cat;
}

@Component({
  selector: 'app-cat-editor-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './cat-editor-dialog.component.html',
  styleUrl: './cat-editor-dialog.component.scss'
})
export class CatEditorDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CatEditorDialogComponent, CatDraft>);
  readonly data = inject<CatEditorDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.cat?.name ?? '', [Validators.required, Validators.maxLength(40)]],
    age: [this.data.cat?.age ?? '', [Validators.required, Validators.pattern(/^\d+$/)]],
    description: [
      this.data.cat?.description ?? '',
      [Validators.required, Validators.maxLength(240)]
    ]
  });

  get title(): string {
    return this.data.mode === 'create' ? 'Add Cat' : 'Edit Cat';
  }

  get submitLabel(): string {
    return this.data.mode === 'create' ? 'Save Cat' : 'Update Cat';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
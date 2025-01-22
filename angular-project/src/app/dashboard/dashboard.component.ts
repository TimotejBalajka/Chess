import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { TestService } from '../test.service';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { MatList, MatListItem } from '@angular/material/list';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticationService } from '../api-authorization/authentication.service';
import { MatButton } from '@angular/material/button';
import { HttpEventType } from '@angular/common/http';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MatList,
    MatListItem,
    NgForOf,
    MatTable,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatHeaderCellDef,
    MatColumnDef,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRow,
    MatButton,
    MatProgressBar
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private testService = inject(TestService);
  private authService = inject(AuthenticationService);
  private destroyRef = inject(DestroyRef);

  dataSource: MatTableDataSource<string>;
  fileToBeUploaded: File;
  uploadMessage: string;
  uploadProgress: number = 0;

  isAdmin = this.authService.admin;

  ngOnInit(): void {
    this.testService.getNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(names => this.dataSource = new MatTableDataSource(names));
  }

  uploadFile() {
    this.uploadMessage = '';
    this.testService.uploadFile(this.fileToBeUploaded)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploadMessage = 'Upload complete!';
        }
      });
  }

  setSelectedFile($event: Event) {
    this.fileToBeUploaded = (event.target as HTMLInputElement).files[0];
  }
}

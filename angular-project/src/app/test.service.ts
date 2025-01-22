import { inject, Inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private httpClient = inject(HttpClient);

  constructor(@Inject('BASE_URL') private baseUrl: string) { }

  getNames() {
    return this.httpClient.get<string[]>(this.baseUrl + '/home');
  }

  uploadFile(fileToBeUploaded: File): Observable<HttpEvent<string>> {
    const formData = new FormData();
    formData.append('file', fileToBeUploaded);

    return this.httpClient.post<string>(this.baseUrl + '/file', formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}

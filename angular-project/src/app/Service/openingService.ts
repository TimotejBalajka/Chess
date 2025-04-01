import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class openningService {

  constructor(private http: HttpClient, @Inject("BASE_URL") private baseUrl: string) { }

  getChessOpenings() {
    return this.http.get<chessOpenings[]>(this.baseUrl + '/vratChessOpenings');  
  }
}

interface chessOpenings {
  id: number;
  name: string;
  description: string;
}

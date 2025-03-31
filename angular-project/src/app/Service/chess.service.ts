import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChessService {

  constructor(private http: HttpClient, @Inject("BASE_URL") private baseUrl: string) { }

  getChessOpenings() {
    return this.http.get<chessOpenings>(this.baseUrl);  
  }
}

interface chessOpenings {
  id: number;
  name: string;
  description: string;
}

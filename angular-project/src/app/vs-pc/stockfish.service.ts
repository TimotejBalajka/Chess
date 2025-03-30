import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface StockfishResponse {
  success: boolean;
  evaluation?: number;
  mate?: number | null;
  bestmove?: string;
  continuation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockfishService {
  private apiUrl = 'https://stockfish.online/api/s/v2.php';

  constructor(private http: HttpClient) { }

  getBestMove(fen: string, depth: number = 2): Observable<StockfishResponse> {
    return this.http.get<StockfishResponse>(this.apiUrl, {
      params: {
        fen,
        depth: depth.toString(),
        mode: 'bestmove'
      }
    });
  }
}

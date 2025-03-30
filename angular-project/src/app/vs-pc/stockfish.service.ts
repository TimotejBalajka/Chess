// stockfish.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StockfishService {
  private apiUrl = 'https://stockfish.online/api/s/v2.php';

  constructor(private http: HttpClient) { }

  getBestMove(fen: string, depth: number = 2) {
    const params = {
      fen: fen,
      depth: depth.toString(),
      mode: 'bestmove'
    };

    return this.http.get(this.apiUrl, { params });
  }
}

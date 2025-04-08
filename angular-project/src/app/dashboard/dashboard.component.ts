import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { ChessService } from '../dashboard/chess.service.ts.service';
import { inject } from '@angular/core/testing';
import { openningService } from '../Service/openingService'
import { Subject, takeUntil } from 'rxjs';
import { ChessOpening } from 'src/app/DTOs/chessOpeningDTO'
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [CommonModule],
  standalone: true
})
export class DashboardComponent implements OnInit {
  legalSquares: any[] = [];
  isWhiteTurn: boolean = true;
  boardSquares: any;
  pieces: any;
  piecesImages: any;
  moveHistory: any[] = [];

  currentlyDragging = false;
  private destroy$ = new Subject<void>();
  openings: ChessOpening[];

  showOpeningsPanel: boolean = false;
  constructor(private renderer: Renderer2, private el: ElementRef, private chessService: ChessService,private OpenningService: openningService) { }

  ngOnInit(): void {
    this.setupBoardSquares();
    this.setupPieces();
    this.OpenningService.getChessOpenings()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.openings = res
        console.log(this.openings)
      });
  }

  toggleOpeningsPanel(): void {
    this.showOpeningsPanel = !this.showOpeningsPanel;
  }

  setupBoardSquares(): void {
    this.boardSquares = this.el.nativeElement.querySelectorAll('.square');
    this.boardSquares.forEach((square: any, i: number) => {
      this.renderer.listen(square, 'dragover', (ev) => this.allowDrop(ev));
      this.renderer.listen(square, 'drop', (ev) => this.drop(ev));
      const row = 8 - Math.floor(i / 8);
      const column = String.fromCharCode(97 + (i % 8));
      square.id = column + row;
    });

    const restartButton = this.el.nativeElement.querySelector('#restartButton');
    const saveButton = this.el.nativeElement.querySelector('#saveButton');
    const loadButton = this.el.nativeElement.querySelector('#loadButton');

    this.renderer.listen(restartButton, 'click', () => this.resetBoard());
    this.renderer.listen(saveButton, 'click', () => this.saveGameState());
    this.renderer.listen(loadButton, 'click', () => this.loadGameState());
  }

  setupPieces(): void {
    this.pieces = this.el.nativeElement.querySelectorAll('.piece');

    this.pieces.forEach((piece: any) => {
      const newPiece = piece.cloneNode(true);
      piece.parentNode.replaceChild(newPiece, piece);

      this.renderer.listen(newPiece, 'dragstart', (ev) => this.drag(ev));
      this.renderer.listen(newPiece, 'touchstart', (ev) => this.handleTouchStart(ev));
      this.renderer.listen(newPiece, 'touchmove', (ev) => this.handleTouchMove(ev));
      this.renderer.listen(newPiece, 'touchend', (ev) => this.handleTouchEnd(ev));
      this.renderer.listen(newPiece, 'touchcancel', (ev) => this.handleTouchEnd(ev));

      this.renderer.listen(newPiece, 'mouseenter', (ev) => this.onPieceMouseEnter(ev.target, ev));
      this.renderer.listen(newPiece, 'mouseleave', () => this.onPieceMouseLeave());
      this.renderer.setAttribute(newPiece, 'draggable', 'true');
      newPiece.id = newPiece.className.split(' ')[1] + newPiece.parentElement.id;
    });

    this.piecesImages = this.el.nativeElement.querySelectorAll('.piece img');
    this.piecesImages.forEach((img: any) => {
      this.renderer.setAttribute(img, 'draggable', 'false');
      this.renderer.setStyle(img, 'pointer-events', 'none');
    });
  }

  allowDrop(ev: DragEvent): void {
    ev.preventDefault();
  }

  drag(ev: DragEvent): void {
    this.currentlyDragging = true;
    const piece = ev.target as HTMLElement;

    const actualPiece = piece.classList.contains('piece') ? piece : piece.parentElement as HTMLElement;

    const pieceColor = actualPiece.getAttribute('color');
    if ((this.isWhiteTurn && pieceColor === 'white') || (!this.isWhiteTurn && pieceColor === 'black')) {
      this.chessService.setDragImage(ev, actualPiece);
      ev.dataTransfer?.setData('text/plain', actualPiece.id);
      const startSquare = actualPiece.parentElement?.id;
      if (startSquare) {
        ev.dataTransfer?.setData('startSquare', startSquare);
      }
    }
  }



  drop(ev: DragEvent): void {
    this.currentlyDragging = false;
    ev.preventDefault();
    this.chessService.clearHighlights();

    const pieceId = ev.dataTransfer?.getData('text/plain');
    const piece = document.getElementById(pieceId!);
    const startSquare = document.getElementById(ev.dataTransfer?.getData('startSquare')!);
    const endSquare = ev.currentTarget as HTMLElement;

    if (!this.chessService.isMoveValid(piece!, startSquare, endSquare)) {
      console.log('Invalid move');
      return;
    }

    const capturedPiece = endSquare.querySelector('.piece');
    const capturedPieceType = capturedPiece ? capturedPiece.getAttribute('class') : null;

    if (capturedPiece) {
      endSquare.removeChild(capturedPiece);
    }
    endSquare.appendChild(piece!);

    const move = {
      piece: piece!.className,
      color: piece!.getAttribute('color'),
      start: startSquare.id,
      end: endSquare.id,
      captured: capturedPieceType,
    };
    this.moveHistory.push(move);

    this.updateMoveHistoryDisplay();

    if (piece!.classList.contains('pawn') && (endSquare.id[1] === '1' || endSquare.id[1] === '8')) {
      const color = piece!.getAttribute('color');
      this.promotePawn(piece!, color!);
    }

    this.isWhiteTurn = !this.isWhiteTurn;

    const currentPlayerColor = this.isWhiteTurn ? 'white' : 'black';

    document.querySelectorAll('.square').forEach(square => {
      square.classList.remove('in-check');
    });

    if (this.chessService.isCheckmate(currentPlayerColor)) {
      this.showCheckmateModal(currentPlayerColor === 'white' ? 'Black' : 'White');
    } else if (this.chessService.isCheck(currentPlayerColor)) {
      console.log(`${currentPlayerColor} is in check.`);
    } else {
      console.log('Move executed.');
    }
  }

  showCheckmateModal(winner: string): void {
    const modal = document.getElementById('checkmateModal');
    const winnerText = document.getElementById('checkmateWinnerText');
    const newGameButton = document.getElementById('newGameButton');

    if (modal && winnerText && newGameButton) {
      winnerText.textContent = `${winner} wins the game!`;
      modal.style.display = 'flex';

      newGameButton.onclick = () => {
        modal.style.display = 'none';
        this.resetBoard();
      };
    }
  }
  updateMoveHistoryDisplay(): void {
    const historyDiv = this.el.nativeElement.querySelector('#moveHistory');
    historyDiv.innerHTML = '';

    this.moveHistory.forEach((move, index) => {
      const moveText = document.createElement('p');

      let colorTranslation: string;
      if (move.color === 'white') {
        colorTranslation = 'biely';
      } else {
        colorTranslation = 'čierny';
      }

      const pieceTranslation = this.translatePieceType(move.piece.split(' ')[1]);

      moveText.textContent = `${index + 1}. ${colorTranslation} ${pieceTranslation} na ${move.end}` +
        (move.captured ? ` (Zobratý ${this.translatePieceType(move.captured.split(' ')[1])})` : '');
      historyDiv.appendChild(moveText);
    });

    setTimeout(() => {
      historyDiv.scrollTop = historyDiv.scrollHeight;
    }, 0);
  }

  translatePieceType(pieceType: string): string {
    switch (pieceType) {
      case 'pawn':
        return 'pešiak';
      case 'rook':
        return 'veža';
      case 'knight':
        return 'jazdec';
      case 'bishop':
        return 'strelec';
      case 'queen':
        return 'dáma';
      case 'king':
        return 'kráľ';
      default:
        return pieceType;
    }
  }

  resetBoard(): void {
    const modal = document.getElementById('checkmateModal');
    if (modal) {
      modal.style.display = 'none';
    }

    localStorage.removeItem('chessGameState');

    this.boardSquares.forEach((square: any) => {
      const piece = square.querySelector('.piece');
      if (piece) {
        square.removeChild(piece);
      }
      square.classList.remove('in-check');
    });

    const initialSetup = {
      a1: 'whiteRook', a2: 'whitePawn', a7: 'blackPawn', a8: 'blackRook',
      b1: 'whiteKnight', b2: 'whitePawn', b7: 'blackPawn', b8: 'blackKnight',
      c1: 'whiteBishop', c2: 'whitePawn', c7: 'blackPawn', c8: 'blackBishop',
      d1: 'whiteQueen', d2: 'whitePawn', d7: 'blackPawn', d8: 'blackQueen',
      e1: 'whiteKing', e2: 'whitePawn', e7: 'blackPawn', e8: 'blackKing',
      f1: 'whiteBishop', f2: 'whitePawn', f7: 'blackPawn', f8: 'blackBishop',
      g1: 'whiteKnight', g2: 'whitePawn', g7: 'blackPawn', g8: 'blackKnight',
      h1: 'whiteRook', h2: 'whitePawn', h7: 'blackPawn', h8: 'blackRook',
    };

    for (const [squareId, piece] of Object.entries(initialSetup)) {
      const square = document.getElementById(squareId);
      if (square) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = `piece ${piece.slice(5).toLowerCase()}`;
        pieceDiv.setAttribute('color', piece.startsWith('white') ? 'white' : 'black');
        pieceDiv.setAttribute('draggable', 'true');

        const pieceImg = document.createElement('img');
        pieceImg.src = `assets/${piece}.png`;
        pieceImg.setAttribute('draggable', 'false');
        pieceImg.style.pointerEvents = 'none';

        pieceDiv.appendChild(pieceImg);
        square.appendChild(pieceDiv);
      }
    }

    this.isWhiteTurn = true;
    this.moveHistory = [];
    this.updateMoveHistoryDisplay();

    setTimeout(() => {
      this.setupPieces();
      this.setupBoardSquares();
    }, 0);
  }
  saveGameState(): void {
    const gameState = {
      pieces: [],
      turn: this.isWhiteTurn
    };

    this.boardSquares.forEach((square: any) => {
      const piece = square.querySelector('.piece');
      if (piece) {
        const pieceInfo = {
          id: piece.id,
          color: piece.getAttribute('color'),
          type: piece.classList[1],
          squareId: square.id
        };
        gameState.pieces.push(pieceInfo);
      }
    });

    localStorage.setItem('chessGameState', JSON.stringify(gameState));
    localStorage.setItem('moveHistory', JSON.stringify(this.moveHistory));
    console.log('Game saved!');
  }

  loadGameState(): void {
    const savedGameState = localStorage.getItem('chessGameState');
    const savedMoveHistory = localStorage.getItem('moveHistory');

    if (savedGameState && savedMoveHistory) {
      const gameState = JSON.parse(savedGameState);

      this.boardSquares.forEach((square: any) => {
        const piece = square.querySelector('.piece');
        if (piece) {
          square.removeChild(piece);
        }
      });

      gameState.pieces.forEach((pieceInfo: any) => {
        const square = document.getElementById(pieceInfo.squareId);
        if (square) {
          const pieceDiv = document.createElement('div');
          pieceDiv.className = `piece ${pieceInfo.type}`;
          pieceDiv.setAttribute('color', pieceInfo.color);
          pieceDiv.setAttribute('draggable', 'true');
          pieceDiv.id = pieceInfo.id;

          const pieceImg = document.createElement('img');
          pieceImg.src = `assets/${pieceInfo.color}${pieceInfo.type.charAt(0).toUpperCase() + pieceInfo.type.slice(1)}.png`;
          pieceImg.setAttribute('draggable', 'false');

          pieceDiv.appendChild(pieceImg);

          const firstCoordinate = square.querySelector('.coordinate');
          if (firstCoordinate) {
            square.insertBefore(pieceDiv, firstCoordinate);
          } else {
            square.appendChild(pieceDiv);
          }
        }
      });

      this.moveHistory = JSON.parse(savedMoveHistory);
      this.updateMoveHistoryDisplay();

      this.isWhiteTurn = gameState.turn;
      console.log('Game loaded!');

      setTimeout(() => {
        this.setupPieces();
        this.setupBoardSquares();
      }, 0);
    } else {
      console.log('No saved game found.');
    }
  }
promotePawn(pawn: HTMLElement, color: string): void {
  const modal = this.renderer.createElement('div');
  this.renderer.addClass(modal, 'promotion-modal');

  const options = ['Queen', 'Rook', 'Bishop', 'Knight'];
  options.forEach((option) => {
    const button = this.renderer.createElement('button');
    button.textContent = option.charAt(0).toUpperCase() + option.slice(1);
    this.renderer.listen(button, 'click', () => {
      const newPieceImage = `assets/${color}${option}.png`;
      const pawnImg = pawn.querySelector('img');
      if (pawnImg) {
        this.renderer.setAttribute(pawnImg, 'src', newPieceImage);
      }
      
      this.renderer.setAttribute(pawn, 'class', `piece ${option.toLowerCase()}`);
      pawn.setAttribute('color', color);
      
      pawn.id = `${option.toLowerCase()}${pawn.parentElement?.id}`;
      
      setTimeout(() => {
        this.setupPieces();
      }, 0);
      
      this.renderer.removeChild(document.body, modal);
    });
    this.renderer.appendChild(modal, button);
  });

  this.renderer.appendChild(document.body, modal);
  }

  onPieceMouseLeave(): void {
    if (!this.currentlyDragging) {
      this.chessService.clearHighlights();
    }
  }

  onPieceMouseEnter(piece: HTMLElement, event: MouseEvent): void {
    if ((this.isWhiteTurn && piece.getAttribute('color') === 'white') ||
      (!this.isWhiteTurn && piece.getAttribute('color') === 'black')) {
      const square = piece.parentElement as HTMLElement;
      this.chessService.clearHighlights();

      this.chessService.highlightSquare(square);

      const legalMoves = this.chessService.getLegalMoves(piece, square);
      legalMoves.forEach(move => {
        const squareId = String.fromCharCode(97 + move.x) + (8 - move.y);
        const targetSquare = document.getElementById(squareId);
        if (targetSquare) {
          this.chessService.highlightSquare(targetSquare);
        }
      });
    }
  }

  // Add these properties to your component
  private touchStartTime: number = 0;
  private longPressThreshold: number = 300; // milliseconds
  private touchStartTimeout: any = null;
  private isLongPress: boolean = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private draggedPiece: HTMLElement | null = null;
  private draggedPieceStartSquare: HTMLElement | null = null;

  // Replace your existing touch handlers with these:
  handleTouchStart(ev: TouchEvent): void {
    ev.preventDefault();
    this.touchStartTime = Date.now();
    const touch = ev.touches[0];

    const piece = ev.target as HTMLElement;
    const actualPiece = piece.classList.contains('piece') ? piece : piece.parentElement as HTMLElement;

    const pieceColor = actualPiece.getAttribute('color');
    if ((this.isWhiteTurn && pieceColor === 'white') || (!this.isWhiteTurn && pieceColor === 'black')) {
      this.touchStartTimeout = setTimeout(() => {
        this.isLongPress = true;
        this.startDragging(actualPiece, touch.clientX, touch.clientY);
      }, this.longPressThreshold);
    }
  }

  handleTouchMove(ev: TouchEvent): void {
    ev.preventDefault();
    if (!this.draggedPiece || !this.isLongPress) return;

    const touch = ev.touches[0];
    this.updatePiecePosition(this.draggedPiece, touch.clientX, touch.clientY);

    // Highlight potential drop squares
    const hoveredSquare = this.chessService.getSquareFromCoordinates(touch.clientX, touch.clientY);
    if (hoveredSquare) {
      this.chessService.clearHighlights();
      this.chessService.highlightSquare(hoveredSquare);
    }
  }

  handleTouchEnd(ev: TouchEvent): void {
    ev.preventDefault();
    clearTimeout(this.touchStartTimeout);

    if (!this.draggedPiece) {
      // This was a tap, not a drag
      if (Date.now() - this.touchStartTime < this.longPressThreshold) {
        const touch = ev.changedTouches[0];
        const tappedElement = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
        const piece = tappedElement.classList.contains('piece') ? tappedElement : tappedElement.closest('.piece');

        if (piece) {
          this.onPieceMouseEnter(piece as HTMLElement, null as any);
        }
      }
      return;
    }

    const touch = ev.changedTouches[0];
    const endSquare = this.chessService.getSquareFromCoordinates(touch.clientX, touch.clientY);

    if (endSquare && this.draggedPieceStartSquare) {
      if (this.chessService.isMoveValid(this.draggedPiece, this.draggedPieceStartSquare, endSquare)) {
        this.dropPiece(this.draggedPiece, this.draggedPieceStartSquare, endSquare);
      } else {
        // Return to original position if invalid move
        this.draggedPieceStartSquare.appendChild(this.draggedPiece);
      }
    } else if (this.draggedPieceStartSquare) {
      // Return to original position if no valid drop
      this.draggedPieceStartSquare.appendChild(this.draggedPiece);
    }

    this.chessService.resetPieceStyles(this.draggedPiece);
    this.chessService.clearHighlights();

    this.draggedPiece = null;
    this.draggedPieceStartSquare = null;
    this.isLongPress = false;
  }

  private startDragging(piece: HTMLElement, clientX: number, clientY: number): void {
    this.draggedPiece = piece;
    this.draggedPieceStartSquare = piece.parentElement as HTMLElement;

    // Visual feedback for dragging
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.width = '15vw';
    piece.style.height = '15vw';
    piece.style.pointerEvents = 'none';
    piece.style.transform = 'translate(-50%, -50%) scale(1.5)';

    this.updatePiecePosition(piece, clientX, clientY);
    this.onPieceMouseEnter(piece, null as any);
  }

  private updatePiecePosition(piece: HTMLElement, clientX: number, clientY: number): void {
    piece.style.left = `${clientX}px`;
    piece.style.top = `${clientY}px`;
  }

  private dropPiece(piece: HTMLElement, startSquare: HTMLElement, endSquare: HTMLElement): void {
    const capturedPiece = endSquare.querySelector('.piece');
    if (capturedPiece) {
      endSquare.removeChild(capturedPiece);
    }

    // Reset styles before appending
    this.chessService.resetPieceStyles(piece);
    endSquare.appendChild(piece);

    // Update game state
    const move = {
      piece: piece.className,
      color: piece.getAttribute('color'),
      start: startSquare.id,
      end: endSquare.id,
      captured: capturedPiece ? capturedPiece.getAttribute('class') : null,
    };
    this.moveHistory.push(move);
    this.updateMoveHistoryDisplay();

    // Check for pawn promotion
    if (piece.classList.contains('pawn') && (endSquare.id[1] === '1' || endSquare.id[1] === '8')) {
      const color = piece.getAttribute('color');
      this.promotePawn(piece, color!);
    }

    this.isWhiteTurn = !this.isWhiteTurn;

    // Check for check/checkmate
    const currentPlayerColor = this.isWhiteTurn ? 'white' : 'black';
    document.querySelectorAll('.square').forEach(sq => sq.classList.remove('in-check'));

    if (this.chessService.isCheckmate(currentPlayerColor)) {
      this.showCheckmateModal(currentPlayerColor === 'white' ? 'Black' : 'White');
    } else if (this.chessService.isCheck(currentPlayerColor)) {
      console.log(`${currentPlayerColor} is in check.`);
    }
  }

}

import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { ChessService } from '../dashboard/chess.service.ts.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  legalSquares: any[] = [];
  isWhiteTurn: boolean = true;
  boardSquares: any;
  pieces: any;
  piecesImages: any;
  moveHistory: any[] = [];

  currentlyDragging = false;


  constructor(private renderer: Renderer2, private el: ElementRef, private chessService: ChessService) { }

  ngOnInit(): void {
    this.setupBoardSquares();
    this.setupPieces();
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
    // First, clear existing references
    this.pieces = this.el.nativeElement.querySelectorAll('.piece');

    // Set up new pieces with fresh event listeners
    this.pieces.forEach((piece: any) => {
      // Remove any existing event listeners by cloning the element
      const newPiece = piece.cloneNode(true);
      piece.parentNode.replaceChild(newPiece, piece);

      // Set up new listeners on the fresh element
      this.renderer.listen(newPiece, 'dragstart', (ev) => this.drag(ev));
      this.renderer.listen(newPiece, 'mouseenter', (ev) => this.onPieceMouseEnter(ev.target, ev));
      this.renderer.listen(newPiece, 'mouseleave', () => this.onPieceMouseLeave());
      this.renderer.setAttribute(newPiece, 'draggable', 'true');
      newPiece.id = newPiece.className.split(' ')[1] + newPiece.parentElement.id;
    });

    // Set up images (prevent them from being draggable)
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

    // Handle case where img is dragged instead of piece div
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
    this.chessService.clearHighlights(); // Clear highlights when dropping

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

      // Add event listener for the new game button
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

      moveText.textContent = `${index + 1}. ${colorTranslation} ${pieceTranslation} to ${move.end}` +
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
    // Clear game state
    const modal = document.getElementById('checkmateModal');
    if (modal) {
      modal.style.display = 'none';
    }

    localStorage.removeItem('chessGameState');

    // Remove all pieces while preserving coordinates
    this.boardSquares.forEach((square: any) => {
      const piece = square.querySelector('.piece');
      if (piece) {
        square.removeChild(piece);
      }
      square.classList.remove('in-check');
    });

    // Create fresh pieces
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

    // Reset game state
    this.isWhiteTurn = true;
    this.moveHistory = [];
    this.updateMoveHistoryDisplay();

    // Force Angular to recognize new elements
    setTimeout(() => {
      this.setupPieces();
      this.setupBoardSquares(); // This will reattach all event listeners
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

      // First, remove only the pieces, not the entire square content
      this.boardSquares.forEach((square: any) => {
        const piece = square.querySelector('.piece');
        if (piece) {
          square.removeChild(piece);
        }
      });

      // Then recreate and place the pieces
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

          // Insert the piece before any coordinate elements
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

      // Reinitialize pieces and board
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
      
      // Remove all existing classes and add new ones
      this.renderer.setAttribute(pawn, 'class', `piece ${option.toLowerCase()}`);
      pawn.setAttribute('color', color);
      
      // Update the piece ID
      pawn.id = `${option.toLowerCase()}${pawn.parentElement?.id}`;
      
      // Reinitialize the piece
      setTimeout(() => {
        this.setupPieces(); // This will rebind all event listeners
      }, 0);
      
      this.renderer.removeChild(document.body, modal);
    });
    this.renderer.appendChild(modal, button);
  });

  this.renderer.appendChild(document.body, modal);
  }

  // Update the mouse leave handler
  onPieceMouseLeave(): void {
    // Only clear highlights if not currently dragging
    if (!this.currentlyDragging) {
      this.chessService.clearHighlights();
    }
  }

  // Update the mouse enter handler
  onPieceMouseEnter(piece: HTMLElement, event: MouseEvent): void {
    if ((this.isWhiteTurn && piece.getAttribute('color') === 'white') ||
      (!this.isWhiteTurn && piece.getAttribute('color') === 'black')) {
      const square = piece.parentElement as HTMLElement;
      this.chessService.clearHighlights();

      // Highlight the current square
      this.chessService.highlightSquare(square);

      // Highlight all legal moves
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
}

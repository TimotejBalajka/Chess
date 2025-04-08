import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChessService {

  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  isMoveValid(piece: HTMLElement, startSquare: HTMLElement, endSquare: HTMLElement): boolean {
    const pieceColor = piece.getAttribute('color');
    const targetPiece = endSquare.querySelector('.piece');

    if (targetPiece && targetPiece.getAttribute('color') === pieceColor) {
      console.log('Cannot capture your own piece');
      return false;
    }

    if (!this.validateMove(piece, startSquare, endSquare)) {
      return false;
    }

    const originalParent = piece.parentElement;
    const capturedPiece = endSquare.querySelector('.piece');
    if (capturedPiece) {
      endSquare.removeChild(capturedPiece);
    }
    endSquare.appendChild(piece);

    const isKingSafe = !this.isCheck(piece.getAttribute('color')!);

    originalParent?.appendChild(piece);
    if (capturedPiece) {
      endSquare.appendChild(capturedPiece);
    }

    return isKingSafe;
  }

  validateMove(piece: HTMLElement, startSquare: HTMLElement, endSquare: HTMLElement): boolean {
    const pieceType = piece.getAttribute('class');
    const pieceColor = piece.getAttribute('color');
    const startX = startSquare.id.charCodeAt(0) - 97;
    const startY = 8 - parseInt(startSquare.id[1]);
    const endX = endSquare.id.charCodeAt(0) - 97;
    const endY = 8 - parseInt(endSquare.id[1]);

    switch (pieceType) {
      case 'piece pawn':
        return this.validatePawnMove(startX, startY, endX, endY, pieceColor!, endSquare);
      case 'piece rook':
        return this.validateRookMove(startX, startY, endX, endY);
      case 'piece knight':
        return this.validateKnightMove(startX, startY, endX, endY);
      case 'piece bishop':
        return this.validateBishopMove(startX, startY, endX, endY);
      case 'piece queen':
        return this.validateQueenMove(startX, startY, endX, endY);
      case 'piece king':
        return this.validateKingMove(startX, startY, endX, endY);
      default:
        return false;
    }
  }

  validatePawnMove(startX: number, startY: number, endX: number, endY: number, color: string, endSquare: HTMLElement): boolean {
    const direction = color === 'white' ? -1 : 1;
    const startingRow = color === 'white' ? 6 : 1;

    if (startX === endX && endY === startY + direction && this.isSquareOccupied(endSquare) === 'blank') {
      return true;
    }

    if (startX === endX && startY === startingRow && endY === startY + 2 * direction) {
      const middleSquareY = startY + direction;
      const middleSquare = document.getElementById(String.fromCharCode(97 + startX) + (8 - middleSquareY));

      if (middleSquare && this.isSquareOccupied(middleSquare) === 'blank' &&
        this.isSquareOccupied(endSquare) === 'blank') {
        return true;
      }
    }

    if (Math.abs(endX - startX) === 1 && endY === startY + direction &&
      this.isSquareOccupied(endSquare) !== 'blank' &&
      this.isSquareOccupied(endSquare) !== color) {
      return true;
    }

    return false;
  }

  validateRookMove(startX: number, startY: number, endX: number, endY: number): boolean {
    if (startX === endX || startY === endY) {
      return this.isRookPathClear(startX, startY, endX, endY);
    }
    return false;
  }

  validateKnightMove(startX: number, startY: number, endX: number, endY: number): boolean {
    const knightMoves = [
      [2, 1], [2, -1],
      [-2, 1], [-2, -1],
      [1, 2], [1, -2],
      [-1, 2], [-1, -2]
    ];
    return knightMoves.some(([dx, dy]) => startX + dx === endX && startY + dy === endY);
  }

  validateBishopMove(startX: number, startY: number, endX: number, endY: number): boolean {
    if (Math.abs(endX - startX) === Math.abs(endY - startY)) {
      return this.isBishopPathClear(startX, startY, endX, endY);
    }
    return false;
  }

  validateQueenMove(startX: number, startY: number, endX: number, endY: number): boolean {
    const isDiagonal = Math.abs(endX - startX) === Math.abs(endY - startY);
    const isStraight = startX === endX || startY === endY;
    return (isDiagonal && this.isBishopPathClear(startX, startY, endX, endY)) ||
      (isStraight && this.isRookPathClear(startX, startY, endX, endY));
  }

  validateKingMove(startX: number, startY: number, endX: number, endY: number): boolean {
    return Math.abs(endX - startX) <= 1 && Math.abs(endY - startY) <= 1;
  }

  isSquareOccupied(square: HTMLElement): string {
    const piece = square.querySelector('.piece');
    if (piece) {
      return piece.getAttribute('color')!;
    } else {
      return 'blank';
    }
  }

  isCheck(color: string): boolean {
    const opponentColor = color === 'white' ? 'black' : 'white';
    const kingSquare = this.findKing(color);

    document.querySelectorAll('.square').forEach(square => {
      square.classList.remove('in-check');
    });

    for (const square of Array.from(document.getElementsByClassName('square'))) {
      const piece = square.querySelector('.piece');
      if (piece && piece.getAttribute('color') === opponentColor) {
        const pieceType = piece.getAttribute('class');

        const startX = square.id.charCodeAt(0) - 97;
        const startY = 8 - parseInt(square.id[1]);
        const endX = kingSquare.id.charCodeAt(0) - 97;
        const endY = 8 - parseInt(kingSquare.id[1]);

        if (this.canAttack(piece, pieceType!, startX, startY, endX, endY)) {
          kingSquare.classList.add('in-check');
          return true;
        }
      }
    }
    return false;
  }

  findKing(color: string): HTMLElement {
    for (const square of Array.from(document.getElementsByClassName('square'))) {
      const piece = square.querySelector('.piece');
      if (piece && piece.getAttribute('class') === 'piece king' && piece.getAttribute('color') === color) {
        return square as HTMLElement;
      }
    }
    return null!;
  }

  canAttack(piece: Element, pieceType: string, startX: number, startY: number, endX: number, endY: number): boolean {
    switch (pieceType) {
      case 'piece pawn':
        const direction = piece.getAttribute('color') === 'white' ? -1 : 1;
        const targetSquare = document.getElementById(String.fromCharCode(97 + endX) + (8 - endY));
        if (!targetSquare) return false; // Ensure the target square exists
        return (
          Math.abs(endX - startX) === 1 &&
          endY === startY + direction &&
          this.isSquareOccupied(targetSquare) !== piece.getAttribute('color') // Compare strings correctly
        );
      case 'piece rook':
        return startX === endX || startY === endY ? this.isRookPathClear(startX, startY, endX, endY) : false;
      case 'piece bishop':
        return Math.abs(endX - startX) === Math.abs(endY - startY) ? this.isBishopPathClear(startX, startY, endX, endY) : false;
      case 'piece queen':
        const isDiagonal = Math.abs(endX - startX) === Math.abs(endY - startY);
        const isStraight = startX === endX || startY === endY;
        return (isDiagonal && this.isBishopPathClear(startX, startY, endX, endY)) || (isStraight && this.isRookPathClear(startX, startY, endX, endY));
      case 'piece knight':
        const knightMoves = [
          [2, 1], [2, -1],
          [-2, 1], [-2, -1],
          [1, 2], [1, -2],
          [-1, 2], [-1, -2]
        ];
        return knightMoves.some(([dx, dy]) => startX + dx === endX && startY + dy === endY);
      case 'piece king':
        return Math.abs(endX - startX) <= 1 && Math.abs(endY - startY) <= 1;
      default:
        return false;
    }
  }
  isCheckmate(currentPlayerColor: string): boolean {
    const kingInCheck = this.isCheck(currentPlayerColor);
    if (!kingInCheck) return false;

    const boardSquares = Array.from(document.getElementsByClassName('square'));

    for (const square of boardSquares) {
      const piece = square.querySelector('.piece');
      if (piece && piece.getAttribute('color') === currentPlayerColor) {
        const pieceType = piece.getAttribute('class');

        const startX = square.id.charCodeAt(0) - 97;
        const startY = 8 - parseInt(square.id[1]);

        for (let endX = 0; endX < 8; endX++) {
          for (let endY = 0; endY < 8; endY++) {
            const endSquare = document.getElementById(String.fromCharCode(97 + endX) + (8 - endY));
            if (endSquare) {
              if (this.isMoveValid(piece as HTMLElement, square as HTMLElement, endSquare)) {
                return false;
              }
            }
          }
        }
      }
    }

    return true;
  }

  isRookPathClear(startX: number, startY: number, endX: number, endY: number): boolean {
    if (startX === endX) {
      const step = startY < endY ? 1 : -1;
      for (let y = startY + step; y !== endY; y += step) {
        const index = y * 8 + startX;
        const square = document.getElementById(String.fromCharCode(97 + startX) + (8 - y));
        if (square && this.isSquareOccupied(square) !== 'blank') {
          return false;
        }
      }
    } else if (startY === endY) {
      const step = startX < endX ? 1 : -1;
      for (let x = startX + step; x !== endX; x += step) {
        const index = startY * 8 + x;
        const square = document.getElementById(String.fromCharCode(97 + x) + (8 - startY));
        if (square && this.isSquareOccupied(square) !== 'blank') {
          return false;
        }
      }
    }

    return true;
  }

  isBishopPathClear(startX: number, startY: number, endX: number, endY: number): boolean {
    const deltaX = endX > startX ? 1 : -1;
    const deltaY = endY > startY ? 1 : -1;

    let currentX = startX + deltaX;
    let currentY = startY + deltaY;

    while (currentX !== endX && currentY !== endY) {
      const square = document.getElementById(String.fromCharCode(97 + currentX) + (8 - currentY));
      if (!square) {
        console.error(`Square at (${currentX}, ${currentY}) not found!`);
        return false;
      }

      if (this.isSquareOccupied(square) !== 'blank') {
        return false;
      }

      currentX += deltaX;
      currentY += deltaY;
    }

    return true;
  }

  // Add these properties to your ChessService
  private lightSquareHighlight = '#a9a9a9';
  private darkSquareHighlight = '#696969';
  private originalSquareColors: Map<string, string> = new Map();

  // Add these methods to your ChessService
  clearHighlights(): void {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
      const squareElement = square as HTMLElement;
      const originalColor = this.originalSquareColors.get(squareElement.id);

      if (originalColor) {
        squareElement.style.background = originalColor;
      } else {
        // Reset to default colors if no original color was stored
        squareElement.style.background = '';
      }
    });
    this.originalSquareColors.clear();
  }

  // Modify highlightSquare to store original colors
  highlightSquare(square: HTMLElement): void {
    const squareId = square.id;

    // Only store the original color if we haven't already
    if (!this.originalSquareColors.has(squareId)) {
      const currentColor = square.style.background;
      this.originalSquareColors.set(squareId, currentColor || '');
    }

    const isDark = square.classList.contains('black');
    const highlightColor = isDark ? this.darkSquareHighlight : this.lightSquareHighlight;
    square.style.background = highlightColor;
  } 

  getLegalMoves(piece: HTMLElement, square: HTMLElement): { x: number, y: number }[] {
    const legalMoves: { x: number, y: number }[] = [];
    const pieceType = piece.getAttribute('class')!.split(' ')[1];
    const pieceColor = piece.getAttribute('color')!;
    const startX = square.id.charCodeAt(0) - 97;
    const startY = 8 - parseInt(square.id[1]);

    // Check all possible squares
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const endSquare = document.getElementById(String.fromCharCode(97 + x) + (8 - y));
        if (endSquare) {
          // Temporarily move the piece to check if the move is valid
          if (this.isMoveValid(piece, square, endSquare)) {
            legalMoves.push({ x, y });
          }
        }
      }
    }

    return legalMoves;
  }

  // Add to ChessService
  setDragImage(ev: DragEvent, piece: HTMLElement): void {
    const img = piece.querySelector('img');
    if (img) {
      // Create a temporary drag image element
      const dragImg = new Image();
      dragImg.src = img.getAttribute('src') || '';
      ev.dataTransfer?.setDragImage(dragImg, dragImg.width / 2, dragImg.height / 2);
    }
  }

  // Add to ChessService
  getSquareFromCoordinates(clientX: number, clientY: number): HTMLElement | null {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const element of elements) {
      if (element.classList.contains('square')) {
        return element as HTMLElement;
      }
    }
    return null;
  }

  resetPieceStyles(piece: HTMLElement): void {
    piece.style.position = '';
    piece.style.zIndex = '';
    piece.style.width = '';
    piece.style.height = '';
    piece.style.pointerEvents = '';
    piece.style.transform = '';
    piece.style.left = '';
    piece.style.top = '';
  }
}


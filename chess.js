let board;
let selectedXY;
let maxDepth;

//event handler for new game menu button
const newGameMenu = () => {
    const elem = document.getElementById('newgame');
    elem.classList.toggle('visible');
    document.getElementById('newgamebutton').classList.toggle('selected-button');
}

//event handler for about button
const about = () => {
    const elem = document.getElementById('about');
    elem.classList.toggle('visible');
    document.getElementById('aboutbutton').classList.toggle('selected-button');
}

//start a new game playing as white
const startAsWhite = (evt) => {
    startGame();
    board = new Board(true);
    refreshBoard();
    playerTurn();
}

//start a new game playing as black
const startAsBlack = (evt) => {
    startGame();
    board = new Board(false);
    refreshBoard();
    movePiece2();
}

//procedures always executed when starting new game
const startGame = () => {
    //get chosen difficulty setting
    const difficulties = document.querySelectorAll('input[name="difficulty"]');
    for (let input of difficulties) {
        if(input.checked) {
            //set maximum search depth
            maxDepth = Number.parseInt(input.value);
            break;
        }
    }
    //reset winner display box
    const winner = document.getElementById('winnerdisplay');
    winner.innerHTML = '';
    winner.style.display = 'none';
    winner.style.animationName = '';
    
    //clear out all classes and handlers from game board
    removeClass('movable');
    removeClass('selected');
    removeClass('move-target');
    removeHandler(selectPiece);
    removeHandler(movePiece);
    clearCaptured(); //clear captured display

    newGameMenu(); //close new game menu
}

//clear contents of captured piece areas
const clearCaptured = () => {
    for (let i = 0; i < 16; i++) {
        clearCell(`player-capt${i}`);
        clearCell(`ai-capt${i}`);
    }
}

//clear contents of one captured piece area cell
const clearCell = (id) => {
    let cell = document.getElementById(id);
    if (cell.firstChild) {
        cell.firstChild.remove();
    }
}

// uses x and y coordinates to form the id-string for the corresponding sqare on the board
const getSquareID = (xy) => {
    return `cell${xy.x}${xy.y}`;
}

//return coordinate for square with given id
const getSquareCoordinate = (id) => {
    return new Coordinate(id[4], id[5]);
}

// removes class ClassName from all squares on board
const removeClass = (className) => {
    //go through each square and remove className from class list
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            document.getElementById(getSquareID(new Coordinate(x, y))).classList.remove(className);
        }
    }
}

//returns filename of icon for piece
const getIcon = (piece) => {
    const icon = document.createElement('img');
    let src = piece.color;
    let alt;
    if (piece instanceof Pawn) {
        src += 'pawn.png';
        alt = 'Pawn';
    }
    if (piece instanceof Rook) {
        src += 'rook.png';
        alt = 'Rook';
    }
    if (piece instanceof Knight) {
        src += 'knight.png';
        alt = 'Knight';
    }
    if (piece instanceof Bishop) {
        src += 'bishop.png';
        alt = 'Bishop';
    }
    if (piece instanceof King) {
        src += 'king.png';
        alt = 'King';
    }
    if (piece instanceof Queen) {
        src += 'queen.png';
        alt = 'Queen';
    }
    icon.setAttribute('src', src);
    icon.setAttribute('alt', alt);
    return icon;
}

const removeHandler = (eventHandler, eventType) => {
    if (!eventType) {
        eventType = 'click';
    }
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            document.getElementById(getSquareID(new Coordinate(x, y))).removeEventListener('click', eventHandler);
        }
    }
}

//refreshes all squares on game board
const refreshBoard = () => {
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const element = document.getElementById(getSquareID(new Coordinate(x, y)));
            //if square is empty, but piece is being displayed, remove piece
            if (element.firstChild && board.grid[x][y] === null) {
                element.firstChild.remove();
                // if square has piece, but no piece is displayed, add piece
            } else if (!element.firstChild && board.grid[x][y] != null) {
                //element.appendChild(board.grid[x][y].getIcon());
                element.appendChild(getIcon(board.grid[x][y]));
            } else if (element.firstChild && board.grid[x][y] != null) {
                element.firstChild.remove();
                //element.appendChild(board.grid[x][y].getIcon());
                element.appendChild(getIcon(board.grid[x][y]));
            }
        }
    }
    board.sortCaptured();
    //update pieces captured by ai
    for (let i = 0; i < board.aiCaptured.length; i++) {
        const element = document.getElementById(`ai-capt${i}`);
        if (element.firstChild) {
            element.firstChild.remove();
        }
        element.appendChild(getIcon(board.aiCaptured[i]));
    }
    //update pieces captured by player
    for (let i = 0; i < board.playerCaptured.length; i++) {
        const element = document.getElementById(`player-capt${i}`);
        if (element.firstChild) {
            element.firstChild.remove();
        }
        element.appendChild(getIcon(board.playerCaptured[i]));
    }
}

//set up web classes and listeners at beginning of player turn
const playerTurn = () => {
    const pieces = board.getPlayerSquares(board.playerColor);
    for (let xy of pieces) {
        if (board.getPotMoves(xy, true).length === 0) {
            continue;
        }
        //get piece's table cell div element
        let tCell = document.getElementById(getSquareID(xy));
        tCell.classList.add('movable');
        //add event listener to table cell
        tCell.addEventListener('click', selectPiece);
    }
}

//event handler: select piece for moving
const selectPiece = (evt) => {
    removeClass('selected');
    removeClass('move-target');
    removeHandler(movePiece);
    const id = evt.currentTarget.id;
    const xy = getSquareCoordinate(id);
    selectedXY = xy;

    document.getElementById(getSquareID(xy)).classList.add('selected');
    //get potential moves for selected piece
    const potMoves = board.getPotMoves(xy, true);

    for (let move of potMoves) {
        let targetElement = document.getElementById(getSquareID(move));
        targetElement.addEventListener('click', movePiece);

        targetElement.classList.add('move-target');
    }
}

//set winner notification box on
const winNotification = (color) => {
    let field = document.getElementById('winnerdisplay');
    let text = document.createElement('span');
    text.innerHTML = `The ${color} player won!`;
    field.appendChild(text);
    //make box visible and animated
    field.style.display = 'block';
    field.style.animationName = 'fade-in';
}

//event handler: move selected piece to clicked square
const movePiece = (evt) => {
    removeClass('selected');
    removeClass('move-target');
    removeClass('movable');
    removeHandler(selectPiece);
    removeHandler(movePiece);
    const origin = selectedXY;
    const destination = getSquareCoordinate(evt.currentTarget.id);

    animateMove(origin, destination, true);
    board.move(origin, destination);
}

//event handler: after player move animation
const movePiece2 = (evt) => {
    refreshBoard();
    board.aiTurn();
    if (board.winner === board.playerColor) {
        winNotification(board.winner);
        return;
    }
    let origin = board.lastOrigin;
    let destination = board.lastDestination;
    //timeout needed after resource intensive ai calculations
    setTimeout(animateMove, 50, origin, destination, false);
}

//event handler: after computer move animation
const movePiece3 = (evt) => {
    refreshBoard();
    if (board.winner === board.aiColor) {
        winNotification(board.winner);
        return;
    }
    playerTurn();
}

//animate piece moving
const animateMove = (origin, destination, playerMove) => {
    removeClass('moving');

    const piece = document.getElementById(getSquareID(origin)).firstChild;
    //calculate total number of pixels to move in x and y directions
    let size = document.getElementById('cell00').offsetWidth;
    const deltaX = (destination.x - origin.x) * size;
    const deltaY = (destination.y - origin.y) * size;
    //set css variables
    piece.style.setProperty('--deltaX', `${deltaX}px`);
    piece.style.setProperty('--deltaY', `${deltaY}px`);

    //add event listener to continue code after move ends
    if (playerMove) {
        piece.addEventListener('animationend', movePiece2);
    } else {
        piece.addEventListener('animationend', movePiece3);
    }

    //castling
    //piece is king, and is moving over 1 space on x axis
    if (board.grid[origin.x][origin.y] instanceof King && destination.x - origin.x > 1) {
        const rookPiece = document.getElementById(getSquareID(new Coordinate(7, origin.y))).firstChild;
        const rookDeltaX = -2 * size;
        const rookDeltaY = 0;
        rookPiece.style.setProperty('--deltaX', `${rookDeltaX}px`);
        rookPiece.style.setProperty('--deltaY', `${rookDeltaY}px`);
        rookPiece.classList.add('moving');
    }
    piece.classList.add('moving');
}

//chess piece values
const values = {
    'pawn': 1,
    'knight': 3,
    'bishop': 3,
    'rook': 5,
    'queen': 9,
    'king': 90
}

//create new grid and populate with pieces at start positions
const newGrid = (playerColor, aiColor) => {
    let grid = [];
    //create grid as array or arrays
    for (let x = 0; x < 8; x++) {
        grid.push([]);
        for (let y = 0; y < 8; y++) {
            grid[x].push(null);
        }
    }
    //create opponent pieces
    grid[0][0] = new Rook(aiColor);
    grid[1][0] = new Knight(aiColor);
    grid[2][0] = new Bishop(aiColor);
    grid[3][0] = new Queen(aiColor);
    grid[4][0] = new King(aiColor);
    grid[5][0] = new Bishop(aiColor);
    grid[6][0] = new Knight(aiColor);
    grid[7][0] = new Rook(aiColor);
    for (let x = 0; x < 8; x++) {
        grid[x][1] = new Pawn(aiColor);
    }
    for (let x = 0; x < 8; x++) {
        grid[x][6] = new Pawn(playerColor);
    }
    grid[0][7] = new Rook(playerColor);
    grid[1][7] = new Knight(playerColor);
    grid[2][7] = new Bishop(playerColor);
    grid[3][7] = new Queen(playerColor);
    grid[4][7] = new King(playerColor);
    grid[5][7] = new Bishop(playerColor);
    grid[6][7] = new Knight(playerColor);
    grid[7][7] = new Rook(playerColor);

    return grid;
}

//returns copy of grid along with copies of all pieces on grid
const copyGrid = (grid) => {
    const newGrid = [];
    for (let x = 0; x < 8; x++) {
        newGrid.push([]);
        for (let y = 0; y < 8; y++) {
            piece = grid[x][y];
            if (piece) {
                newGrid[x].push(piece.copyPiece());
            } else {
                newGrid[x].push(null);
            }
        }
    }
    return newGrid;
}

//make copy of oldBoard
const copyBoard = (oldBoard) => {
    const playWhite = oldBoard.playerColor === 'white';
    const newBoard = new Board(playWhite, copyGrid(oldBoard.grid));
    newBoard.depth = oldBoard.depth;
    return newBoard;
}

//represents one spot on the board
class Coordinate {
    constructor(x, y) {
        this.x = Number.parseInt(x);
        this.y = Number.parseInt(y);
    }
}

//superclass for all chess piece subclasses
class Piece {
    constructor(color) {
        this.color = color;
        this.moved = false;
    }

    //return whether given piece is same color as this piece
    isSameColor(piece) {
        return this.color === piece.color;
    }

    //get all valid straight moves up to limit squares
    getStraightMoves(xy, grid, limit) {
        return this.getLinearMoves(xy, grid, [[1, 0], [-1, 0], [0, 1], [0, -1]], limit);
    }

    //get all valid diagonal moves up to limit squares
    getDiagonalMoves(xy, grid, limit) {
        return this.getLinearMoves(xy, grid, [[1, 1], [1, -1], [-1, 1], [-1, -1]], limit);
    }

    /*
    returns an array of possible move coordinates for piece at coordinate xy in one or more linear directions
    xy - coordinate of piece to be moved
    grid ([x][y]) - 2d array describing pieces on board
    directions - array containing number pairs that describe direction vectors. Each pair describes the x and y displacement for each move
                    example: [1,0] describes a line of moves directly to the right and [-1,-1] is a diagonal line to the upper left
    limit - maximum number of moves in each direction
    */
    getLinearMoves(xy, grid, directions, limit) {
        const moves = [];

        for (let direction of directions) {
            let step = 1;
            while (true) {
                let x = xy.x + step * direction[0];
                let y = xy.y + step * direction[1];
                //index is out of bounds or move limit has been reached
                if (x > 7 || x < 0 || y > 7 || y < 0 || step > limit) {
                    break;
                }
                //square is empty
                if (!grid[x][y]) {
                    moves.push(new Coordinate(x, y));
                    step++;
                    continue;
                }
                //piece in square is same color
                if (this.isSameColor(grid[x][y])) {
                    break;
                } else {
                    //piece in square is opponent's
                    moves.push(new Coordinate(x, y));
                    break;
                }
            }
        }
        return moves;
    }
    //returns copy of piece
    copyPiece() {
        let newPiece;
        if (this instanceof Pawn) {
            newPiece = new Pawn(this.color);
        }
        if (this instanceof Rook) {
            newPiece = new Rook(this.color);
        }
        if (this instanceof Knight) {
            newPiece = new Knight(this.color);
        }
        if (this instanceof Bishop) {
            newPiece = new Bishop(this.color);
        }
        if (this instanceof King) {
            newPiece = new King(this.color);
        }
        if (this instanceof Queen) {
            newPiece = new Queen(this.color);
        }
        newPiece.moved = this.moved;
        return newPiece;
    }
}

class Pawn extends Piece {
    constructor(color) {
        super(color);
    }
    //return an array of possible moves for this piece
    getMoves(xy, grid, playerColor) {
        const moves = [];
        let factor; // determines whether piece is moving up or down
        if (this.color === playerColor) {
            factor = 1;
        } else {
            factor = -1;
        }

        //space directly ahead is empty
        if (!grid[xy.x][xy.y - factor]) {
            moves.push(new Coordinate(xy.x, xy.y - factor));
            //if not moved yet, can move two squares
            if (!this.moved) {
                if (!grid[xy.x][xy.y - factor * 2]) {
                    moves.push(new Coordinate(xy.x, xy.y - factor * 2));
                }
            }
        }
        //piece is not on left edge of board
        if (xy.x > 0) {
            //piece exists in target diagonal square
            if (grid[xy.x - 1][xy.y - factor]) {
                //piece belongs to opponent
                if (!this.isSameColor(grid[xy.x - 1][xy.y - factor])) {
                    moves.push(new Coordinate(xy.x - 1, xy.y - factor));
                }
            }
        }
        //piece is not on right edge of board
        if (xy.x < 7) {
            //piece exists in target diagonal square
            if (grid[xy.x + 1][xy.y - factor]) {
                //piece belongs to opponent
                if (!this.isSameColor((grid[xy.x + 1][xy.y - factor]))) {
                    moves.push(new Coordinate(xy.x + 1, xy.y - factor));
                }
            }
        }
        return moves;
    }
    getValue() {
        return values.pawn;
    }
}

class King extends Piece {
    constructor(color) {
        super(color);
        this.moved = false; //use to determine whether castling is possible
    }
    getMoves(xy, grid, playerColor) {
        const moves = this.getStraightMoves(xy, grid, 1).concat(this.getDiagonalMoves(xy, grid, 1));
        //castling:
        //king and adjacent rook must be unmoved
        //both squares between them must be empty
        if (!this.moved && grid[7][xy.y]
            && !grid[5][xy.y] && !grid[6][xy.y]) {
            if (!grid[7][xy.y].moved) {
                moves.push(new Coordinate(6, xy.y));
            }
        }
        return moves;
    }
    getValue() {
        return values.king;
    }
}

class Queen extends Piece {
    constructor(color) {
        super(color);
    }
    getMoves(xy, grid, playerColor) {
        return this.getStraightMoves(xy, grid, 8).concat(this.getDiagonalMoves(xy, grid, 8));
    }
    getValue() {
        return values.queen;
    }

}

class Rook extends Piece {
    constructor(color) {
        super(color);
    }
    getMoves(xy, grid, playerColor) {
        return this.getStraightMoves(xy, grid, 8);
    }
    getValue() {
        return values.rook;
    }
}

class Knight extends Piece {
    constructor(color) {
        super(color);
    }
    getMoves(xy, grid, playerColor) {
        return this.getLinearMoves(xy, grid, [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], 1);
    }
    getValue() {
        return values.knight;
    }
}

class Bishop extends Piece {
    constructor(color) {
        super(color);
    }
    getMoves(xy, grid, playerColor) {
        return this.getDiagonalMoves(xy, grid, 8);
    }
    getValue() {
        return values.bishop;
    }
}

const sortPieces = (firstPiece, secondPiece) => {
    return firstPiece.getValue() - secondPiece.getValue();
}

//handles all movement logic of pieces
//knows the board grid with info for each piece by coordinate (x,y) from upper right corner
//knows which player is playing which color
class Board {
    constructor(playWhite, grid) {
        //set player colors
        if (playWhite) {
            this.playerColor = 'white';
            this.aiColor = 'black';
        } else {
            this.playerColor = 'black';
            this.aiColor = 'white';
        }
        if (grid) {
            this.grid = grid;
        } else {
            this.grid = newGrid(this.playerColor, this.aiColor);
        }
        this.depth = 0;
        this.winner = null;
        this.playerCaptured = [];
        this.aiCaptured = [];
    }

    //sort captured pieces by piece value
    sortCaptured() {
        this.aiCaptured.sort(sortPieces);
        this.playerCaptured.sort(sortPieces);
    }

    //move a piece
    move(origin, destination) {
        const piece = this.grid[origin.x][origin.y];
        const target = this.grid[destination.x][destination.y];

        //if piece is moved onto existing piece, mark as captured
        if (target) {
            if (target.color === this.playerColor) {
                this.aiCaptured.push(target);
            } else {
                this.playerCaptured.push(target);
            }
        }

        //promote piece if it is a pawn at opposite side of board
        if (piece instanceof Pawn && ((piece.color === this.playerColor && destination.y === 0) || (piece.color === this.aiColor && destination.y === 7))) {
            this.promote(destination, piece.color);
        }
        else {
            this.grid[destination.x][destination.y] = piece;
            //castling - unmoved king can only reach x-index 1 when castling
            if (piece instanceof King && !piece.moved && destination.x === 6) {
                let rookPiece = this.grid[7][origin.y];
                rookPiece.moved = true;
                this.grid[5][origin.y] = rookPiece;
                this.grid[7][origin.y] = null;
            }
        }
        piece.moved = true;
        this.grid[origin.x][origin.y] = null;
    }

    //mark game as ended
    endGame(winner) {
        this.winner = winner;
    }

    //promote pawn to queen at coordinate xy
    promote(xy, color) {
        this.grid[xy.x][xy.y] = new Queen(color);
    }

    //return array of coordinates of one player's pieces
    getPlayerSquares(color) {
        const coords = [];
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                if (this.grid[x][y]) {
                    if (this.grid[x][y].color === color) {
                        coords.push(new Coordinate(x, y))
                    }
                }
            }
        }
        return coords;
    }

    //returns potential moves for one piece at coordinate xy
    //  protectKing (boolean) - should moves that leave king vulnerable be filtered out
    getPotMoves(xy, protectKing) {
        let potMoves = this.grid[xy.x][xy.y].getMoves(xy, this.grid, this.playerColor);
        //filter out every move that leaves king vulnerable
        if (protectKing) {
            potMoves = potMoves.filter(move => {
                return !this.willKingBeThreatened(xy, move);
            });
        }
        return potMoves;
    }

    //returns all potential moves for one color
    getAllMoves(color) {
        const allMoves = [];
        const squares = this.getPlayerSquares(color);
        for (let square of squares) {
            let moves = this.getPotMoves(square, true);
            for (let move of moves) {
                allMoves.push([square, move]);
            }
        }
        return allMoves;
    }

    //get the total value of pieces on board
    getBoardValue() {
        let totalValue = 0;
        //go through each square on board
        for (let column of this.grid) {
            for (let piece of column) {
                if (!piece) {
                    continue;
                }
                //if square contains piece, get value
                let value = piece.getValue();
                //if piece belongs to ai, make value negative
                if (piece.color === this.aiColor) {
                    value *= -1;
                }
                //add everything up
                totalValue += value;
            }
        }
        return totalValue;
    }

    //if move from origin to destination is made, will moving player's king be left vulnerable
    willKingBeThreatened(origin, destination) {
        //keep original board situation for restoration
        let originPiece = this.grid[origin.x][origin.y];
        let originMoved = originPiece.moved;
        let destinationPiece = this.grid[destination.x][destination.y];
        let originAiCaptured = this.aiCaptured.map((x) => x);
        let originPlayerCaptured = this.playerCaptured.map((x) => x);
        //need to remember rook position when castling
        let rookPiece;
        if (originPiece instanceof King && !originPiece.moved && destination.x === 6) {
            rookPiece = this.grid[7][origin.y];
        }
        //determine opposing player's color
        let otherColor;
        if (originPiece.color === 'black') {
            otherColor = 'white';
        } else {
            otherColor = 'black';
        }
        //make the move
        this.move(origin, destination);
        //see if king is now left open after move
        const result = this.isKingThreatened(otherColor);
        //restore board to original configuration
        originPiece.moved = originMoved;
        this.grid[origin.x][origin.y] = originPiece;
        this.grid[destination.x][destination.y] = destinationPiece;
        this.aiCaptured = originAiCaptured;
        this.playerCaptured = originPlayerCaptured;
        //restore rook if move was castling
        if (rookPiece) {
            this.grid[5][origin.y] = null;
            this.grid[7][origin.y] = rookPiece;
            rookPiece.moved = false;
        }

        return result;
    }

    //examine all potential moves for movingColor
    //do any moves threaten opposing king?
    isKingThreatened(movingColor) {
        //get all pieces
        let pieces = this.getPlayerSquares(movingColor);
        //get potential moves for each piece, check if any moves threaten king
        for (let piece of pieces) {
            //use false parameter, so getPotMoves doesn't redirect back here
            let moves = this.getPotMoves(piece, false);
            for (let move of moves) {
                let target = this.grid[move.x][move.y];
                if (target instanceof King) {
                    if (target.color != movingColor) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    //process ai move
    aiTurn() {
        let allMoves = this.getAllMoves(this.aiColor); //get all potential moves

        //if no moves available, human won
        if (allMoves.length === 0) {
            this.endGame(this.playerColor);
            return;
        }
        //shuffle moves to prevent ai from favouring upper left corner in even situations
        let shuffledMoves = [];
        while (allMoves.length > 0) {
            let i = Math.floor(Math.random() * allMoves.length);
            shuffledMoves.push(allMoves[i]);
            allMoves.splice(i, 1);
        }
        allMoves = shuffledMoves;

        let alpha = -100000;  //the lowest acceptable score for the human player
        let beta = 100000; //the highest acceptable score for the ai
        let optimalMove;

        //iterate through each potential move
        for (let move of allMoves) {
            let newBoard = copyBoard(this);
            newBoard.depth++;
            newBoard.move(move[0], move[1]);
            //start up recursive algorithm to go down search tree for move
            let moveValue = newBoard.miniMax(this.playerColor, this.aiColor, alpha, beta);
            if (moveValue < beta) {
                beta = moveValue;
                optimalMove = move;
            }
        }
        this.move(optimalMove[0], optimalMove[1]);
        this.lastOrigin = optimalMove[0];
        this.lastDestination = optimalMove[1];

        //check if player has no available moves (ai won)
        if (this.getAllMoves(this.playerColor).length === 0) {
            this.endGame(this.aiColor);
            return;
        }
    }

    //recursive algorithm for analysing game nodes
    miniMax(movingColor, nextColor, alpha, beta) {
        //if at max depth, return board value
        if (this.depth === maxDepth) {
            return this.getBoardValue();
        }
        let playerMoving = movingColor === this.playerColor;
        let allMoves = this.getAllMoves(movingColor);

        //if game lost, return high enough number to make sure move will be top/bottom evaluated
        if (allMoves.length === 0) {
            if (playerMoving) {
                return -500;
            } else {
                return 500;
            }
        }

        let optimal;
        if (playerMoving) {
            optimal = -100000;
        } else {
            optimal = 100000;
        }
        //evaluate every move
        //break out if pruning
        for (let move of allMoves) {
            let newBoard = copyBoard(this);
            newBoard.depth++;
            newBoard.move(move[0], move[1]);
            
            //resolve move value
            let moveValue = newBoard.miniMax(nextColor, movingColor, alpha, beta);
            if (playerMoving && moveValue > optimal) {
                optimal = moveValue;
            }
            if (!playerMoving && moveValue < optimal) {
                optimal = moveValue;
            }

            //alpha-beta pruning
            if (playerMoving && moveValue > alpha) {
                alpha = moveValue;
            }
            if (!playerMoving && moveValue < beta) {
                beta = moveValue;
            }
            if (beta <= alpha) {
                break;
            }
        }
        return optimal;
    }
}
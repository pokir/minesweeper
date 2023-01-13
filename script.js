let COLORS;
const MINE_DENSITY = 0.206;

let game;

let mousePressedOnPreviousFrame = false;
let action = null;

// disable right click popup
document.oncontextmenu = () => false;


function setup() {
  COLORS = {
    CELL_BACKGROUND: color(51, 51, 51),
    REVEALED_CELL_BACKGROUND: color(111, 111, 111),
    CELL_OUTLINE: color(255, 0, 0),
    FLAG: color(200, 200, 0),
    MINE: color(255, 0, 0),
    NUMBER_1: color(0, 0, 255),
    NUMBER_2: color(0, 255, 0),
    NUMBER_3: color(255, 0, 0),
    NUMBER_4: color(100, 0, 255),
    NUMBER_5: color(180, 0, 100),
    NUMBER_6: color(0, 100, 255),
    NUMBER_7: color(0, 0, 0),
    NUMBER_8: color(100, 100, 100),
  };

  createCanvas(30 * 20, 16 * 20);

  game = new Minesweeper(30, 16);
  game.initMines(MINE_DENSITY);
  game.initNumbers();
}


function draw() {
  game.update();

  mousePressedOnPreviousFrame = false; // reset
}


function mousePressed() {
  mousePressedOnPreviousFrame = true;

  return false;
  // return false to prevent any browser default behavior:
  // https://p5js.org/reference/#/p5/mousePressed
}


class Cell {
  constructor(x, y) {
    this.state = null; // -1 = mine, 0 to 8 = number
    this.flagged = false;
    this.revealed = false;

    // position in grid
    this.x = x;
    this.y = y;
  }
}


class Minesweeper {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.grid = [];

    for (let y = 0; y < this.height; ++y) {
      this.grid.push([]);

      for (let x = 0; x < this.width; ++x) {
        this.grid[y].push(new Cell(x, y));
      }
    }

    this.gameOver = false;
  }

  getCellAt(x, y) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width)
      return null;

    return this.grid[y][x];
  }

  getNeighborsOf(cell) {
    // returns the cells adjacent to the given cell (no guaranteed order)

    const neighbors = [];

    for (let i = -1; i < 2; ++i) {
      for (let j = -1; j < 2; ++j) {
        if (i === 0 && j === 0)
          continue;

        const neighbor = this.getCellAt(cell.x + i, cell.y + j);

        if (neighbor !== null) { // if neighbor is outside the grid
          neighbors.push(neighbor);
        }
      }
    }

    return neighbors;
  }

  initMines(probability) {
    // randomly create mines on the grid
    // (keeps the other cells uninitialized)

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        if (Math.random() < probability)
          this.getCellAt(x, y).state = -1;
      }
    }
  }

  initNumbers() {
    // assuming the mines are initialized, places the numbers
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const cell = this.getCellAt(x, y);

        if (cell.state === -1)
          continue;

        const neighbors = this.getNeighborsOf(cell);
        const numberOfMines = neighbors.filter(cell => cell.state === -1).length;

        cell.state = numberOfMines;
      }
    }
  }

  draw() {
    push();

    const canvasCellWidth = width / this.width;
    const canvasCellHeight = height / this.height;

    // draw the background
    background(COLORS.CELL_BACKGROUND);

    // draw the cell contents
    ellipseMode(CORNER);
    rectMode(CORNER)
    noStroke();

    textAlign(CENTER, CENTER);
    textSize(0.8 * min(canvasCellWidth, canvasCellHeight));
    textFont('ROBOTO');

    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const cell = this.getCellAt(x, y);

        if (cell.flagged === true) {
          fill(COLORS.FLAG);

          ellipse(
            cell.x * canvasCellWidth, cell.y * canvasCellHeight,
            canvasCellWidth, canvasCellHeight,
          );

          continue;
        }

        if (cell.revealed === false)
          continue;

        // change background color of a clicked cell
        fill(COLORS.REVEALED_CELL_BACKGROUND)
        rect(
          cell.x * canvasCellWidth, cell.y * canvasCellHeight,
          canvasCellWidth, canvasCellHeight
        );

        if (cell.state === -1) {
          fill(COLORS.MINE);

          // draw a mine
          ellipse(
            cell.x * canvasCellWidth, cell.y * canvasCellHeight,
            canvasCellWidth, canvasCellHeight,
          );
        } else if (cell.state !== 0) {
          fill(COLORS[`NUMBER_${cell.state}`]);

          // draw the number
          text(
            cell.state,
            cell.x * canvasCellWidth + canvasCellWidth / 2,
            cell.y * canvasCellHeight + canvasCellHeight / 2,
          );
        }

        // don't draw anything if number is 0
      }
    }

    stroke(COLORS.CELL_OUTLINE);

    // draw horizontal grid lines
    for (let i = 0; i < this.height + 1; ++i) {
      line(0, i * canvasCellHeight, width, i * canvasCellHeight);
    }

    // draw vertical grid lines
    for (let i = 0; i < this.width + 1; ++i) {
      line(i * canvasCellWidth, 0, i * canvasCellWidth, height);
    }

    if (this.gameOver === true) {
      fill(255, 255, 255);
      textSize(min(width, height) / 5);
      text('GAME OVER', width / 2, height / 2);
    }

    pop();
  }

  update() {
    // Do game logic
    // Returns true if the game is still playing, false if game over

    this.draw();

    if (this.gameOver)
      return true;

    this.handleClick();

    return false;
  }

  revealCell(cell, chord) {
    // recursively reveal a cell if chording or if there are zeros
    cell.revealed = true;

    // if a mine was revealed (either by directly clicking or by chording)
    // then game over
    if (cell.state === -1)
      this.gameOver = true;

    // if not chording or the number is not zero, don't recursively reveal
    if (chord === false && cell.state !== 0)
      return;

    let unrevealedNeighbors = this.getNeighborsOf(cell)
      .filter(cell => cell.revealed === false);

    // when chording, don't reveal flagged cells
    // (if it is a zero, do reveal them)
    if (chord === true)
      unrevealedNeighbors = unrevealedNeighbors
        .filter(cell => cell.flagged === false);

    // reveal them
    for (const neighbor of unrevealedNeighbors) {
      this.revealCell(neighbor, false);
    }
  }

  handleClick() {
    if (mousePressedOnPreviousFrame === false)
      return;

    const cellX = Math.floor(this.width * mouseX / width);
    const cellY = Math.floor(this.height * mouseY / height);

    const cell = this.getCellAt(cellX, cellY);

    if (mouseButton === LEFT && cell.flagged === false) {
      if (cell.revealed === true && cell.state !== -1) {
        // a number was clicked, so chord (reveal all numbers around)
        // but only if there are the right number of flags around
        const numberOfFlags = this.getNeighborsOf(cell)
          .filter(cell => cell.flagged === true).length;

        if (numberOfFlags === cell.state)
          this.revealCell(cell, true);
      } else {
        this.revealCell(cell, false);
      }
    } else if (mouseButton === RIGHT && cell.revealed === false) {
      // toggle the flag
      cell.flagged = !cell.flagged;
    }
  }
}

class Tile {
  constructor() {
    this.revealed = false;
    this.flagged = false;
  }

  reveal() {
    return "blocked";
  }

  isRevealed() {
    return this.revealed;
  }

  isFlagged() {
    return this.flagged;
  }

  toggleFlag() {
    if (this.revealed) return false;
    this.flagged = !this.flagged;
    return true;
  }
}

class MineTile extends Tile {
  reveal() {
    if (this.flagged || this.revealed) return "blocked";
    this.revealed = true;
    return "mine";
  }
}

class EmptyTile extends Tile {
  constructor() {
    super();
    this.adjacentMines = 0;
  }

  setAdjacentMines(count) {
    this.adjacentMines = count;
  }

  getAdjacentMines() {
    return this.adjacentMines;
  }

  reveal(field, row, col) {
    if (this.flagged || this.revealed) return "blocked";
    this.revealed = true;
    if (this.adjacentMines !== 0) return "safe";

    field.neighbors(row, col).forEach(([nextRow, nextCol]) => {
      const tile = field.getTile(nextRow, nextCol);
      if (tile instanceof EmptyTile && !tile.isRevealed() && !tile.isFlagged()) {
        tile.reveal(field, nextRow, nextCol);
      }
    });
    return "opened";
  }
}

class Minefield {
  constructor(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.mines = mines;
    this.grid = [];
    this.armed = false;

    for (let row = 0; row < rows; row += 1) {
      const line = [];
      for (let col = 0; col < cols; col += 1) line.push(new EmptyTile());
      this.grid.push(line);
    }
  }

  arm(safeRow, safeCol) {
    const spots = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (row !== safeRow || col !== safeCol) spots.push([row, col]);
      }
    }

    for (let index = spots.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const hold = spots[index];
      spots[index] = spots[swap];
      spots[swap] = hold;
    }

    const count = Math.min(this.mines, spots.length);
    for (let index = 0; index < count; index += 1) {
      const [row, col] = spots[index];
      this.grid[row][col] = new MineTile();
    }
    this.calculateAdjacentMines();
    this.armed = true;
  }

  calculateAdjacentMines() {
    const directions = [-1, 0, 1];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (this.grid[row][col] instanceof MineTile) continue;
        let mineCount = 0;
        directions.forEach((dx) => {
          directions.forEach((dy) => {
            const nextRow = row + dx;
            const nextCol = col + dy;
            if (this.inBounds(nextRow, nextCol) && this.grid[nextRow][nextCol] instanceof MineTile) mineCount += 1;
          });
        });
        this.grid[row][col].setAdjacentMines(mineCount);
      }
    }
  }

  neighbors(row, col) {
    const found = [];
    [-1, 0, 1].forEach((dx) => {
      [-1, 0, 1].forEach((dy) => {
        if (dx === 0 && dy === 0) return;
        const nextRow = row + dx;
        const nextCol = col + dy;
        if (this.inBounds(nextRow, nextCol)) found.push([nextRow, nextCol]);
      });
    });
    return found;
  }

  inBounds(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  getTile(row, col) {
    return this.grid[row][col];
  }

  isGameWon() {
    return this.grid.every((line) => line.every((tile) => tile instanceof MineTile || tile.isRevealed()));
  }

  getRows() {
    return this.rows;
  }
}

class GameManager {
  constructor(rows, cols, mines, difficulty) {
    this.minefield = new Minefield(rows, cols, mines);
    this.minesLeft = mines;
    this.difficulty = difficulty;
    this.history = GameManager.loadHistory();
  }

  getMinefield() {
    return this.minefield;
  }

  getDifficulty() {
    return this.difficulty;
  }

  decrementMinesLeft() {
    this.minesLeft -= 1;
  }

  incrementMinesLeft() {
    this.minesLeft += 1;
  }

  getMinesLeft() {
    return this.minesLeft;
  }

  addHistory(result, size, difficulty, elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeStamp = new Date().toLocaleString("zh-TW", { hour12: false });
    const entry = timeStamp + "｜" + result + "｜" + difficulty + "｜" + size + "×" + size + "｜" + minutes + " 分 " + seconds + " 秒";
    this.history.unshift(entry);
    this.history = this.history.slice(0, 8);
    GameManager.saveHistory(this.history);
  }

  getHistory() {
    return this.history;
  }

  static loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem("mcu-minesweeper-history") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  static saveHistory(entries) {
    try {
      localStorage.setItem("mcu-minesweeper-history", JSON.stringify(entries));
    } catch (error) {
      // 這台瀏覽器不讓網頁寫入紀錄時，遊戲本身仍然可以玩。
    }
  }
}

function calculateMines(size, difficulty) {
  const area = size * size;
  const divisor = { Easy: 10, Medium: 6, Hard: 4, Extreme: 3, Insane: 2 }[difficulty] || 10;
  return Math.max(1, Math.min(area - 1, Math.floor(area / divisor)));
}

const boardEl = document.querySelector("#board");
const minesEl = document.querySelector("#minesLeft");
const timeEl = document.querySelector("#elapsed");
const bannerEl = document.querySelector("#banner");
const historyEl = document.querySelector("#history");
const codeEl = document.querySelector("#codeView");
const traceEl = document.querySelector("#trace");
const flagModeEl = document.querySelector("#flagMode");
const sizeEl = document.querySelector("#size");
const difficultyEl = document.querySelector("#difficulty");

let manager = null;
let playing = false;
let startedAt = 0;
let timerId = 0;
let sourceText = "";

const classNotes = {
  Tile: "每格共同的動作：揭開，以及插旗或拔旗。",
  MineTile: "地雷格。被揭開而且沒有插旗，這局就結束。",
  EmptyTile: "空格會記住周圍有幾顆地雷。數字是 0 時，把鄰居一起揭開。",
  Minefield: "棋盤。第一下落子之後才布雷，並算出每一格的數字。",
  GameManager: "管剩餘地雷數、難度，以及這台瀏覽器裡的勝敗紀錄。",
  calculateMines: "沿用原本的比例：簡單約一成地雷，地獄約一半。",
};

function extractBlock(source, name) {
  const marker = name === "calculateMines" ? "function calculateMines" : "class " + name;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  let depth = 0;
  let opened = false;
  let quote = "";
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const prev = source[index - 1];
    if (quote) {
      if (char === quote && prev !== "\\") quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      index = source.indexOf("\n", index);
      if (index < 0) break;
      continue;
    }
    if (char === "{") {
      depth += 1;
      opened = true;
    } else if (char === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, index + 1).trim();
    }
  }
  return "";
}

function highlight(code) {
  return code
    .split("\n")
    .map((line) => {
      const commentAt = line.indexOf("//");
      const codePart = commentAt >= 0 ? line.slice(0, commentAt) : line;
      const comment = commentAt >= 0 ? line.slice(commentAt) : "";
      const colored = escapeHtml(codePart).replace(
        /\b(class|extends|constructor|return|if|else|for|new|this|const|let|function|static|true|false|instanceof)\b/g,
        '<span class="kw">$1</span>'
      );
      return colored + (comment ? '<span class="cm">' + escapeHtml(comment) + "</span>" : "");
    })
    .join("\n");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function showCode(name, trace) {
  document.querySelectorAll("[data-class]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.class === name);
  });
  const block = sourceText ? extractBlock(sourceText, name) : "";
  codeEl.innerHTML = block ? highlight(block) : "程式讀取失敗，請從作品集重新開啟這一頁。";
  traceEl.textContent = trace || classNotes[name];
}

async function loadSource() {
  try {
    const response = await fetch("minesweeper.js");
    sourceText = response.ok ? await response.text() : "";
  } catch (error) {
    sourceText = "";
  }
  showCode("Minefield");
}

function renderHistory() {
  const entries = manager ? manager.getHistory() : GameManager.loadHistory();
  historyEl.innerHTML = "";
  if (!entries.length) {
    historyEl.hidden = true;
    return;
  }
  historyEl.hidden = false;
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    historyEl.appendChild(item);
  });
}

function setBanner(text, kind) {
  bannerEl.textContent = text;
  bannerEl.className = "banner" + (kind ? " " + kind : "");
  bannerEl.hidden = !text;
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = 0;
}

function elapsedSeconds() {
  if (!startedAt) return 0;
  return Math.floor((Date.now() - startedAt) / 1000);
}

function paintTime() {
  const total = elapsedSeconds();
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  timeEl.textContent = minutes + ":" + seconds;
}

function paintMines() {
  minesEl.textContent = manager ? String(manager.getMinesLeft()) : "–";
}

function renderBoard() {
  const field = manager.getMinefield();
  const size = field.getRows();
  boardEl.style.setProperty("--board-size", String(size));
  boardEl.innerHTML = "";

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const tile = field.getTile(row, col);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.row = String(row);
      button.dataset.col = String(col);

      if (tile.isRevealed()) {
        button.classList.add("is-open");
        button.disabled = true;
        if (tile instanceof MineTile) {
          button.classList.add("is-mine");
          button.textContent = "雷";
          button.setAttribute("aria-label", "地雷");
        } else {
          const count = tile.getAdjacentMines();
          if (count > 0) {
            button.textContent = String(count);
            button.dataset.count = String(count);
            button.setAttribute("aria-label", "周圍 " + count + " 顆地雷");
          } else {
            button.setAttribute("aria-label", "空白");
          }
        }
      } else if (tile.isFlagged()) {
        button.classList.add("is-flag");
        button.textContent = "旗";
        button.setAttribute("aria-label", "已插旗");
      } else {
        button.setAttribute("aria-label", "尚未揭開");
      }

      boardEl.appendChild(button);
    }
  }
}

function finish(result, codeName, trace) {
  playing = false;
  stopTimer();
  const field = manager.getMinefield();
  if (result === "失敗") {
    field.grid.forEach((line) => {
      line.forEach((tile) => {
        if (tile instanceof MineTile) tile.revealed = true;
      });
    });
    setBanner("踩到地雷了", "lost");
  } else {
    setBanner("這局過了", "won");
  }
  manager.addHistory(result, field.getRows(), manager.getDifficulty(), elapsedSeconds());
  renderBoard();
  renderHistory();
  showCode(codeName, trace);
}

function revealCell(row, col) {
  if (!playing) return;
  const field = manager.getMinefield();
  const firstClick = !field.armed;
  if (firstClick) {
    field.arm(row, col);
    startedAt = Date.now();
    paintTime();
    timerId = window.setInterval(paintTime, 250);
  }

  const tile = field.getTile(row, col);
  const outcome = tile.reveal(field, row, col);
  if (outcome === "blocked") {
    showCode("Tile", "這格已經插旗。Tile 不讓它被揭開，要先把旗子拿掉。");
    return;
  }
  if (outcome === "mine") {
    finish("失敗", "MineTile", "MineTile.reveal()：這格是地雷，而且沒有插旗。失敗已寫進紀錄。");
    return;
  }
  const firstNote = firstClick ? "第一下先由 Minefield 避開這一格才布雷。" : "";
  if (outcome === "opened") {
    showCode("EmptyTile", firstNote + "EmptyTile.reveal()：周圍是 0，所以把相鄰的空格一起揭開。");
  } else {
    showCode("EmptyTile", firstNote + "EmptyTile.reveal()：周圍有 " + tile.getAdjacentMines() + " 顆地雷，只打開這一格。");
  }
  renderBoard();
  paintMines();
  if (field.isGameWon()) {
    finish("過關", "GameManager", "空格都揭開了。GameManager.addHistory() 把過關時間留在這台瀏覽器。");
  }
}

function flagCell(row, col) {
  if (!playing) return;
  const field = manager.getMinefield();
  const tile = field.getTile(row, col);
  const changed = tile.toggleFlag();
  if (!changed) return;
  if (tile.isFlagged()) manager.decrementMinesLeft();
  else manager.incrementMinesLeft();
  renderBoard();
  paintMines();
  showCode("Tile", "Tile.toggleFlag() 插上或拿掉旗子，GameManager 再把剩餘地雷數加減一。");
}

function startGame() {
  const size = Number(sizeEl.value);
  if (!Number.isInteger(size) || size < 5 || size > 35) {
    setBanner("地圖邊長要填 5 到 35", "lost");
    sizeEl.focus();
    return;
  }
  stopTimer();
  startedAt = 0;
  paintTime();
  const difficulty = difficultyEl.value;
  const mines = calculateMines(size, difficulty);
  manager = new GameManager(size, size, mines, difficulty);
  playing = true;
  setBanner("");
  paintMines();
  renderBoard();
  renderHistory();
  showCode("calculateMines", "地圖 " + size + "×" + size + "，" + difficulty + " 會放 " + mines + " 顆地雷。比例跟 Java 版一樣。");
}

boardEl.addEventListener("click", (event) => {
  const button = event.target.closest(".cell");
  if (!button || button.disabled) return;
  const row = Number(button.dataset.row);
  const col = Number(button.dataset.col);
  if (flagModeEl.dataset.on === "true") flagCell(row, col);
  else revealCell(row, col);
});

boardEl.addEventListener("contextmenu", (event) => {
  const button = event.target.closest(".cell");
  if (!button) return;
  event.preventDefault();
  if (button.disabled) return;
  flagCell(Number(button.dataset.row), Number(button.dataset.col));
});

document.querySelector("#start").addEventListener("click", startGame);
flagModeEl.addEventListener("click", () => {
  const on = flagModeEl.dataset.on !== "true";
  flagModeEl.dataset.on = on ? "true" : "false";
  flagModeEl.setAttribute("aria-pressed", on ? "true" : "false");
  flagModeEl.textContent = on ? "插旗中" : "插旗";
});

document.querySelectorAll("[data-class]").forEach((button) => {
  button.addEventListener("click", () => showCode(button.dataset.class));
});

renderHistory();
loadSource();

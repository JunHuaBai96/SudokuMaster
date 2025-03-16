class SudokuUI {
    constructor() {
        this.selectedCell = null;
        this.gameType = 'standard';
        this.mistakes = 3;
        this.hints = 3;
        this.timer = null;
        this.seconds = 0;
        this.userGrid = [];
        this.initializeUI();
    }

    initializeUI() {
        // 初始化游戏类型选择
        document.getElementById('gameType').addEventListener('change', (e) => {
            this.gameType = e.target.value;
            this.resetGame();
        });

        // 初始化控制按钮
        document.getElementById('newGame').addEventListener('click', () => this.resetGame());
        document.getElementById('hint').addEventListener('click', () => this.showHint());
        document.getElementById('reset').addEventListener('click', () => this.resetCurrentGame());

        // 初始化数字键盘事件
        this.initializeNumpad();

        // 加载最佳时间
        this.loadBestTime();
    }

    initializeNumpad() {
        const numpad = document.getElementById('numpad');
        numpad.innerHTML = '';
        const size = this.getGridSize();

        for (let i = 1; i <= size; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.addEventListener('click', () => this.handleNumpadClick(i));
            numpad.appendChild(button);
        }

        // 添加删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => this.handleNumpadClick(0));
        numpad.appendChild(deleteButton);
    }

    getGridSize() {
        switch (this.gameType) {
            case 'mini4': return 4;
            case 'mini6': return 6;
            case 'large12': return 12;
            case 'large16': return 16;
            default: return 9;
        }
    }

    createGrid(puzzle) {
        const grid = document.getElementById('sudokuGrid');
        grid.innerHTML = '';
        grid.className = `sudoku-grid ${this.gameType}`;
        const size = this.getGridSize();

        this.userGrid = Array(size).fill().map(() => Array(size).fill(0));

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if (puzzle[i][j] !== 0) {
                    cell.textContent = puzzle[i][j];
                    cell.classList.add('given');
                    this.userGrid[i][j] = puzzle[i][j];
                    cell.addEventListener('click', () => this.highlightSameNumbers(puzzle[i][j]));
                } else {
                    cell.addEventListener('click', () => {
                        this.selectCell(cell, i, j);
                        this.updateNumpadAvailability(i, j);
                    });
                }
                cell.dataset.row = i;
                cell.dataset.col = j;
                grid.appendChild(cell);
            }
        }
    }

    selectCell(cell, row, col) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected', 'highlighted', 'same-number');
        });

        this.selectedCell = cell;
        cell.classList.add('selected');
        this.highlightRelatedCells(row, col);

        if (cell.textContent) {
            this.highlightSameNumbers(cell.textContent);
        }
    }

    highlightRelatedCells(row, col) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('highlighted'));

        const size = this.getGridSize();
        let boxRowSize, boxColSize;
        
        // 获取小方块大小
        switch (this.gameType) {
            case 'mini4':
                boxRowSize = boxColSize = 2;
                break;
            case 'mini6':
                boxRowSize = 2;
                boxColSize = 3;
                break;
            case 'large12':
                boxRowSize = 3;
                boxColSize = 4;
                break;
            case 'large16':
                boxRowSize = boxColSize = 4;
                break;
            default:
                boxRowSize = boxColSize = 3;
        }

        cells.forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);

            // 高亮同行和同列
            if (cellRow === row || cellCol === col) {
                cell.classList.add('highlighted');
            }

            // 高亮同一个小方块
            if (this.gameType !== 'irregular') {
                const boxRow = Math.floor(row / boxRowSize) * boxRowSize;
                const boxCol = Math.floor(col / boxColSize) * boxColSize;
                if (Math.floor(cellRow / boxRowSize) === Math.floor(row / boxRowSize) &&
                    Math.floor(cellCol / boxColSize) === Math.floor(col / boxColSize)) {
                    cell.classList.add('highlighted');
                }
            }

            // 高亮对角线（仅对角线数独）
            if (this.gameType === 'diagonal') {
                if ((row === col && cellRow === cellCol) ||
                    (row + col === size - 1 && cellRow + cellCol === size - 1)) {
                    cell.classList.add('highlighted');
                }
            }
        });
    }

    highlightSameNumbers(number) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('same-number');
            if (cell.textContent === number.toString()) {
                cell.classList.add('same-number');
            }
        });
    }

    updateNumpadAvailability(row, col) {
        const size = this.getGridSize();
        let boxRowSize, boxColSize;
        
        // 获取小方块大小
        switch (this.gameType) {
            case 'mini4':
                boxRowSize = boxColSize = 2;
                break;
            case 'mini6':
                boxRowSize = 2;
                boxColSize = 3;
                break;
            case 'large12':
                boxRowSize = 3;
                boxColSize = 4;
                break;
            case 'large16':
                boxRowSize = boxColSize = 4;
                break;
            default:
                boxRowSize = boxColSize = 3;
        }

        const unavailableNumbers = new Set();

        // 检查行
        for (let j = 0; j < size; j++) {
            if (this.userGrid[row][j] !== 0) {
                unavailableNumbers.add(this.userGrid[row][j]);
            }
        }

        // 检查列
        for (let i = 0; i < size; i++) {
            if (this.userGrid[i][col] !== 0) {
                unavailableNumbers.add(this.userGrid[i][col]);
            }
        }

        // 检查小方块
        if (this.gameType !== 'irregular') {
            const boxRow = Math.floor(row / boxRowSize) * boxRowSize;
            const boxCol = Math.floor(col / boxColSize) * boxColSize;
            for (let i = 0; i < boxRowSize; i++) {
                for (let j = 0; j < boxColSize; j++) {
                    const value = this.userGrid[boxRow + i][boxCol + j];
                    if (value !== 0) {
                        unavailableNumbers.add(value);
                    }
                }
            }
        }

        // 检查对角线（仅对角线数独）
        if (this.gameType === 'diagonal') {
            if (row === col) {
                for (let i = 0; i < size; i++) {
                    if (this.userGrid[i][i] !== 0) {
                        unavailableNumbers.add(this.userGrid[i][i]);
                    }
                }
            }
            if (row + col === size - 1) {
                for (let i = 0; i < size; i++) {
                    if (this.userGrid[i][size - 1 - i] !== 0) {
                        unavailableNumbers.add(this.userGrid[i][size - 1 - i]);
                    }
                }
            }
        }

        // 更新数字键盘按钮状态
        const numpadButtons = document.querySelectorAll('#numpad button');
        numpadButtons.forEach(button => {
            if (button.textContent !== '删除') {
                const num = parseInt(button.textContent);
                if (unavailableNumbers.has(num)) {
                    button.classList.add('unavailable');
                } else {
                    button.classList.remove('unavailable');
                }
            }
        });
    }

    handleNumpadClick(num) {
        if (!this.selectedCell || this.selectedCell.classList.contains('given')) {
            return;
        }

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        if (num === 0) {
            // 删除数字
            this.selectedCell.textContent = '';
            this.userGrid[row][col] = 0;
            this.updateNumpadState();
            this.updateNumpadAvailability(row, col);
            return;
        }

        // 验证移动是否有效
        if (!window.game.validateMove(row, col, num, this.userGrid)) {
            this.mistakes--;
            document.getElementById('mistakes').textContent = this.mistakes;
            if (this.mistakes === 0) {
                this.gameOver(false);
                return;
            }
            this.selectedCell.classList.add('error');
            setTimeout(() => this.selectedCell.classList.remove('error'), 1000);
            return;
        }

        this.userGrid[row][col] = num;
        this.selectedCell.textContent = num;
        this.updateNumpadState();
        this.highlightSameNumbers(num);
        this.updateNumpadAvailability(row, col);

        // 检查是否完成游戏
        if (window.game.isComplete(this.userGrid)) {
            if (window.game.checkSolution(this.userGrid)) {
                this.gameOver(true);
            }
        }
    }

    updateNumpadState() {
        const size = this.getGridSize();
        const numCounts = new Array(size + 1).fill(0);

        // 统计每个数字的出现次数
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.userGrid[i][j] !== 0) {
                    numCounts[this.userGrid[i][j]]++;
                }
            }
        }

        // 更新数字键盘按钮状态
        const numpadButtons = document.querySelectorAll('#numpad button');
        numpadButtons.forEach((button, index) => {
            if (button.textContent !== '删除') {
                const num = parseInt(button.textContent);
                if (numCounts[num] >= size) {
                    button.classList.add('used');
                } else {
                    button.classList.remove('used');
                }
            }
        });
    }

    showHint() {
        if (!this.selectedCell || this.selectedCell.classList.contains('given') || this.hints <= 0) {
            return;
        }

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        const hint = window.game.getHint(row, col);

        this.selectedCell.textContent = hint;
        this.userGrid[row][col] = hint;
        this.selectedCell.classList.add('given');
        this.hints--;
        document.getElementById('hints').textContent = this.hints;
        this.updateNumpadState();

        // 检查是否完成游戏
        if (window.game.isComplete(this.userGrid)) {
            if (window.game.checkSolution(this.userGrid)) {
                this.gameOver(true);
            }
        }
    }

    startTimer() {
        this.stopTimer();
        this.seconds = 0;
        this.updateTimer();
        this.timer = setInterval(() => {
            this.seconds++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.seconds / 60);
        const remainingSeconds = this.seconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        document.getElementById('time').textContent = timeString;
    }

    loadBestTime() {
        const bestTime = localStorage.getItem(`bestTime_${this.gameType}`) || '--:--';
        document.getElementById('bestTime').textContent = bestTime;
    }

    saveBestTime() {
        const currentTime = this.seconds;
        const bestTimeStr = localStorage.getItem(`bestTime_${this.gameType}`);
        
        if (bestTimeStr === '--:--' || !bestTimeStr) {
            localStorage.setItem(`bestTime_${this.gameType}`, this.formatTime(currentTime));
            return true;
        }

        const [bestMin, bestSec] = bestTimeStr.split(':').map(Number);
        const bestSeconds = bestMin * 60 + bestSec;

        if (currentTime < bestSeconds) {
            localStorage.setItem(`bestTime_${this.gameType}`, this.formatTime(currentTime));
            return true;
        }

        return false;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    gameOver(won) {
        this.stopTimer();
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');

        if (won) {
            modalTitle.textContent = '恭喜！';
            const isBestTime = this.saveBestTime();
            modalMessage.textContent = `你成功完成了游戏！用时：${this.formatTime(this.seconds)}` +
                (isBestTime ? '（新纪录！）' : '');
        } else {
            modalTitle.textContent = '游戏结束';
            modalMessage.textContent = '已用完所有机会，请重新开始游戏。';
        }

        modal.style.display = 'block';
        document.getElementById('modalClose').onclick = () => {
            modal.style.display = 'none';
            if (!won) {
                this.resetGame();
            }
        };
    }

    resetCurrentGame() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (!cell.classList.contains('given')) {
                cell.textContent = '';
                this.userGrid[cell.dataset.row][cell.dataset.col] = 0;
            }
        });
        this.mistakes = 3;
        document.getElementById('mistakes').textContent = this.mistakes;
        this.updateNumpadState();
    }

    resetGame() {
        this.stopTimer();
        this.mistakes = 3;
        this.hints = 3;
        document.getElementById('mistakes').textContent = this.mistakes;
        document.getElementById('hints').textContent = this.hints;
        this.loadBestTime();
        this.initializeNumpad();
        window.game = new SudokuGame(this.gameType);
        window.game.generatePuzzle();
        this.createGrid(window.game.grid);
        this.startTimer();
    }
} 
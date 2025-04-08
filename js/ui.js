class SudokuUI {
    constructor(game) {
        if (!game) {
            throw new Error('Game instance is required');
        }
        this.game = game;
        this.selectedCell = null;
        this.gameType = this.game.GAME_TYPES.STANDARD;
        this.mistakes = 3;
        this.hints = 3;
        this.timer = null;
        this.seconds = 0;
        this.userGrid = Array(game.size).fill().map(() => Array(game.size).fill(0));
        this.remainingChances = 3;
        this.startTime = Date.now();
        this.bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
        
        // 初始化游戏界面
        this.initializeUI();
        // 初始化数独网格
        this.initializeGrid();
        // 开始计时器
        this.startTimer();
    }

    initializeUI() {
        // 初始化游戏类型选择
        document.getElementById('gameType').addEventListener('change', (e) => {
            const newType = e.target.value;
            // 确保选择的类型与游戏类型匹配
            if (Object.values(this.game.GAME_TYPES).includes(newType)) {
                this.gameType = newType;
                this.game.type = newType;
                this.resetGame();
            }
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
        const size = this.game.size;

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

    initializeGrid() {
        const grid = document.getElementById('sudokuGrid');
        grid.innerHTML = '';
        grid.className = `sudoku-grid ${this.gameType}`;
        grid.style.gridTemplateColumns = `repeat(${this.game.size}, 1fr)`;

        // 重置用户网格
        this.userGrid = Array(this.game.size).fill().map(() => Array(this.game.size).fill(0));

        // 创建单元格
        for (let i = 0; i < this.game.size; i++) {
            for (let j = 0; j < this.game.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const value = this.game.grid[i][j];
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('given');
                    this.userGrid[i][j] = value;
                }
                
                cell.addEventListener('click', () => {
                    if (!cell.classList.contains('given')) {
                        this.selectCell(i, j);
                        this.updateNumpadAvailability(i, j);
                    } else {
                        this.highlightSameNumbers(value);
                    }
                });
                
                grid.appendChild(cell);
            }
        }

        // 初始化数字键盘
        this.initializeNumpad();
        
        // 更新数字键盘状态
        if (this.selectedCell) {
            const row = parseInt(this.selectedCell.dataset.row);
            const col = parseInt(this.selectedCell.dataset.col);
            this.updateNumpadAvailability(row, col);
        }
    }

    getGridSize() {
        switch (this.gameType) {
            case this.game.GAME_TYPES.MINI4: return 4;    // 迷你数独
            case this.game.GAME_TYPES.MINI6: return 6;    // 矩形数独
            case this.game.GAME_TYPES.LARGE12: return 12; // 矩形大数独
            case this.game.GAME_TYPES.LARGE16: return 16; // 大数独
            default: return 9; // 标准、不规则、对角线数独
        }
    }

    selectCell(row, col) {
        const cells = document.querySelectorAll('#sudokuGrid .cell');
        cells.forEach(c => {
            c.classList.remove('selected', 'highlighted', 'same-number');
        });

        this.selectedCell = cells[row * this.game.size + col];
        this.selectedCell.classList.add('selected');
        this.highlightRelatedCells(row, col);

        if (this.selectedCell.textContent) {
            this.highlightSameNumbers(this.selectedCell.textContent);
        }
    }

    highlightRelatedCells(row, col) {
        const cells = document.querySelectorAll('#sudokuGrid .cell');
        cells.forEach(cell => cell.classList.remove('highlighted'));

        // 高亮相关单元格
        cells.forEach((cell, index) => {
            const cellRow = Math.floor(index / this.game.size);
            const cellCol = index % this.game.size;

            // 高亮同行
            if (cellRow === row) {
                cell.classList.add('highlighted');
            }
            // 高亮同列
            if (cellCol === col) {
                cell.classList.add('highlighted');
            }

            // 根据数独类型处理宫格高亮
            let boxRowSize, boxColSize;
            if (Array.isArray(this.game.boxSize)) {
                [boxRowSize, boxColSize] = this.game.boxSize;
            } else {
                boxRowSize = boxColSize = this.game.boxSize;
            }
            if (Math.floor(cellRow / boxRowSize) === Math.floor(row / boxRowSize) &&
                Math.floor(cellCol / boxColSize) === Math.floor(col / boxColSize)) {
                cell.classList.add('highlighted');
            }
        });
    }

    highlightSameNumbers(number) {
        if (!number || number === '0') return;
        
        const cells = document.querySelectorAll('#sudokuGrid .cell');
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
        
        // 获取宫格大小
        switch (this.gameType) {
            case this.game.GAME_TYPES.MINI4:
                boxRowSize = boxColSize = 2; // 四宫格
                break;
            case this.game.GAME_TYPES.MINI6:
                boxRowSize = 2;
                boxColSize = 3; // 2x3矩形宫格
                break;
            case this.game.GAME_TYPES.LARGE12:
                boxRowSize = 3;
                boxColSize = 4; // 3x4矩形宫格
                break;
            case this.game.GAME_TYPES.LARGE16:
                boxRowSize = boxColSize = 4; // 十六宫格
                break;
            default:
                boxRowSize = boxColSize = 3; // 九宫格
        }

        // 移除所有不可用状态
        const numpadButtons = document.querySelectorAll('#numpad button');
        numpadButtons.forEach(button => {
            button.classList.remove('unavailable');
        });
    }

    handleNumpadClick(num) {
        if (!this.selectedCell || this.selectedCell.classList.contains('given')) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        if (num === 0) {
            // 删除数字
            this.selectedCell.textContent = '';
            this.userGrid[row][col] = 0;
            this.updateNumpadAvailability(row, col);
            return;
        }

        // 检查数字是否正确
        if (this.game.solution[row][col] !== num) {
            this.remainingChances--;
            document.getElementById('mistakes').textContent = this.remainingChances;
            
            // 显示错误动画和提示
            this.selectedCell.classList.add('error');
            setTimeout(() => this.selectedCell.classList.remove('error'), 500);
            
            // 震动反馈（如果设备支持）
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
            
            this.showMistakeAlert();

            if (this.remainingChances <= 0) {
                this.gameOver(false);
                return;
            }
        } else {
            // 填入正确的数字
            this.selectedCell.textContent = num;
            this.userGrid[row][col] = num;
            this.updateNumpadAvailability(row, col);
            
            // 检查是否完成游戏
            if (this.game.checkSolution(this.userGrid)) {
                this.gameOver(true);
            }
        }
    }

    showMistakeAlert() {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'mistake-alert';
        alertDiv.textContent = `错误！还剩 ${this.remainingChances} 次机会`;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 2000);
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
        const hint = this.game.getHint(row, col);

        this.selectedCell.textContent = hint;
        this.userGrid[row][col] = hint;
        this.selectedCell.classList.add('given');
        this.hints--;
        document.getElementById('hints').textContent = this.hints;
        this.updateNumpadState();

        // 检查是否完成游戏
        if (this.game.isComplete(this.userGrid)) {
            if (this.game.checkSolution(this.userGrid)) {
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
        const finalTime = this.seconds;
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        
        if (won) {
            const isBestTime = this.checkAndSaveBestTime(finalTime);
            modal.innerHTML = `
                <h2>${isBestTime ? '恭喜！新纪录！' : '恭喜完成！'}</h2>
                <p>用时：${this.formatTime(finalTime)}</p>
                ${isBestTime ? '<p class="new-record">你创造了新的最佳记录！</p>' : ''}
                <div class="buttons">
                    <button class="retry">再来一局</button>
                    <button class="change-type">更换类型</button>
                    <button class="exit">退出</button>
                </div>
            `;
            
            if (isBestTime) {
                this.showCelebration();
            }
        } else {
            modal.innerHTML = `
                <h2>游戏结束</h2>
                <p>很遗憾，机会用完了</p>
                <div class="buttons">
                    <button class="retry">重新开始</button>
                    <button class="exit">退出</button>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        
        // 添加按钮事件监听
        modal.querySelector('.retry').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.resetGame();
        });
        
        if (won) {
            modal.querySelector('.change-type').addEventListener('click', () => {
                document.body.removeChild(modal);
                document.getElementById('gameType').focus();
            });
        }
        
        modal.querySelector('.exit').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        document.body.appendChild(celebration);
        
        // 创建彩带效果
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
            celebration.appendChild(confetti);
        }
        
        setTimeout(() => {
            document.body.removeChild(celebration);
        }, 5000);
    }

    checkAndSaveBestTime(time) {
        const currentBest = this.bestTimes[this.gameType] || Infinity;
        if (time < currentBest) {
            this.bestTimes[this.gameType] = time;
            localStorage.setItem('bestTimes', JSON.stringify(this.bestTimes));
            return true;
        }
        return false;
    }

    resetCurrentGame() {
        const cells = document.querySelectorAll('#sudokuGrid .cell');
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
        this.game.generatePuzzle();
        this.initializeGrid();
        this.startTimer();
    }
} 
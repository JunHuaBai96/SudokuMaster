class SudokuGame {
    constructor(type = 'standard') {
        this.type = type;
        this.grid = [];
        this.solution = [];
        this.size = this.getGridSize();
        this.boxSize = this.getBoxSize();
        this.initializeGrid();
    }

    getGridSize() {
        switch (this.type) {
            case 'mini4': return 4;
            case 'mini6': return 6;
            case 'large12': return 12;
            case 'large16': return 16;
            default: return 9; // standard, irregular, diagonal
        }
    }

    getBoxSize() {
        switch (this.type) {
            case 'mini4': return 2; // 2x2 boxes
            case 'mini6': return [2, 3]; // 2x3 boxes
            case 'large12': return [3, 4]; // 3x4 boxes
            case 'large16': return 4; // 4x4 boxes
            default: return 3; // 3x3 boxes for standard, irregular, diagonal
        }
    }

    initializeGrid() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.solution = Array(this.size).fill().map(() => Array(this.size).fill(0));
    }

    isValid(row, col, num) {
        // 检查行
        for (let x = 0; x < this.size; x++) {
            if (this.grid[row][x] === num) return false;
        }

        // 检查列
        for (let x = 0; x < this.size; x++) {
            if (this.grid[x][col] === num) return false;
        }

        // 检查小方块
        if (this.type !== 'irregular') {
            let boxRowSize, boxColSize;
            if (Array.isArray(this.boxSize)) {
                [boxRowSize, boxColSize] = this.boxSize;
            } else {
                boxRowSize = boxColSize = this.boxSize;
            }

            const boxRow = Math.floor(row / boxRowSize) * boxRowSize;
            const boxCol = Math.floor(col / boxColSize) * boxColSize;

            for (let i = 0; i < boxRowSize; i++) {
                for (let j = 0; j < boxColSize; j++) {
                    if (this.grid[boxRow + i][boxCol + j] === num) return false;
                }
            }
        }

        // 检查对角线（仅对角线数独）
        if (this.type === 'diagonal') {
            if (row === col) {
                for (let i = 0; i < this.size; i++) {
                    if (this.grid[i][i] === num) return false;
                }
            }
            if (row + col === this.size - 1) {
                for (let i = 0; i < this.size; i++) {
                    if (this.grid[i][this.size - 1 - i] === num) return false;
                }
            }
        }

        return true;
    }

    solve(row = 0, col = 0) {
        if (col === this.size) {
            row++;
            col = 0;
        }
        if (row === this.size) return true;

        if (this.grid[row][col] !== 0) {
            return this.solve(row, col + 1);
        }

        for (let num = 1; num <= this.size; num++) {
            if (this.isValid(row, col, num)) {
                this.grid[row][col] = num;
                if (this.solve(row, col + 1)) {
                    return true;
                }
                this.grid[row][col] = 0;
            }
        }
        return false;
    }

    generatePuzzle(difficulty = 'medium') {
        // 首先生成完整的解决方案
        this.solve();
        for (let i = 0; i < this.size; i++) {
            this.solution[i] = [...this.grid[i]];
        }

        // 根据难度决定要移除多少个数字
        let cellsToRemove;
        switch (difficulty) {
            case 'easy':
                cellsToRemove = Math.floor(this.size * this.size * 0.4);
                break;
            case 'medium':
                cellsToRemove = Math.floor(this.size * this.size * 0.5);
                break;
            case 'hard':
                cellsToRemove = Math.floor(this.size * this.size * 0.6);
                break;
            default:
                cellsToRemove = Math.floor(this.size * this.size * 0.5);
        }

        // 随机移除数字
        while (cellsToRemove > 0) {
            const row = Math.floor(Math.random() * this.size);
            const col = Math.floor(Math.random() * this.size);
            if (this.grid[row][col] !== 0) {
                this.grid[row][col] = 0;
                cellsToRemove--;
            }
        }
    }

    checkSolution(userGrid) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (userGrid[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    getHint(row, col) {
        return this.solution[row][col];
    }

    isComplete(userGrid) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (userGrid[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    validateMove(row, col, num, userGrid) {
        // 保存当前状态
        const currentValue = userGrid[row][col];
        userGrid[row][col] = num;

        // 检查行
        const rowNums = new Set();
        for (let j = 0; j < this.size; j++) {
            if (userGrid[row][j] !== 0) {
                if (rowNums.has(userGrid[row][j])) {
                    userGrid[row][col] = currentValue;
                    return false;
                }
                rowNums.add(userGrid[row][j]);
            }
        }

        // 检查列
        const colNums = new Set();
        for (let i = 0; i < this.size; i++) {
            if (userGrid[i][col] !== 0) {
                if (colNums.has(userGrid[i][col])) {
                    userGrid[row][col] = currentValue;
                    return false;
                }
                colNums.add(userGrid[i][col]);
            }
        }

        // 检查小方块
        if (this.type !== 'irregular') {
            let boxRowSize, boxColSize;
            if (Array.isArray(this.boxSize)) {
                [boxRowSize, boxColSize] = this.boxSize;
            } else {
                boxRowSize = boxColSize = this.boxSize;
            }

            const boxRow = Math.floor(row / boxRowSize) * boxRowSize;
            const boxCol = Math.floor(col / boxColSize) * boxColSize;
            const boxNums = new Set();

            for (let i = 0; i < boxRowSize; i++) {
                for (let j = 0; j < boxColSize; j++) {
                    const value = userGrid[boxRow + i][boxCol + j];
                    if (value !== 0) {
                        if (boxNums.has(value)) {
                            userGrid[row][col] = currentValue;
                            return false;
                        }
                        boxNums.add(value);
                    }
                }
            }
        }

        // 检查对角线（仅对角线数独）
        if (this.type === 'diagonal') {
            if (row === col) {
                const diagNums = new Set();
                for (let i = 0; i < this.size; i++) {
                    if (userGrid[i][i] !== 0) {
                        if (diagNums.has(userGrid[i][i])) {
                            userGrid[row][col] = currentValue;
                            return false;
                        }
                        diagNums.add(userGrid[i][i]);
                    }
                }
            }
            if (row + col === this.size - 1) {
                const antiDiagNums = new Set();
                for (let i = 0; i < this.size; i++) {
                    if (userGrid[i][this.size - 1 - i] !== 0) {
                        if (antiDiagNums.has(userGrid[i][this.size - 1 - i])) {
                            userGrid[row][col] = currentValue;
                            return false;
                        }
                        antiDiagNums.add(userGrid[i][this.size - 1 - i]);
                    }
                }
            }
        }

        // 恢复原值
        userGrid[row][col] = currentValue;
        return true;
    }
} 
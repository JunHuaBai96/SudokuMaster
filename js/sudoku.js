class SudokuGame {
    constructor(type = 'standard') {
        // 定义游戏类型常量
        this.GAME_TYPES = {
            STANDARD: 'standard',    // 标准数独 (9x9 | 九宫格)
            MINI4: 'mini4',         // 迷你数独 (4x4 | 四宫格)
            MINI6: 'mini6',         // 矩形数独 (6x6 | 2x3宫格)
            LARGE12: 'large12',     // 矩形大数独 (12x12 | 3x4宫格)
            LARGE16: 'large16',     // 大数独 (16x16 | 十六宫格)
            IRREGULAR: 'irregular', // 不规则数独 (9x9 | 异形宫格)
            DIAGONAL: 'diagonal'    // 对角线数独 (9x9 | 含主对角线)
        };

        this.type = type;
        this.grid = [];
        this.solution = [];
        this.size = this.getGridSize();
        this.boxSize = this.getBoxSize();
        this.seed = Date.now();
        this.initializeGrid();
        // 生成初始数独谜题
        this.generatePuzzle('medium');
    }

    getGridSize() {
        switch (this.type) {
            case this.GAME_TYPES.MINI4: return 4;    // 迷你数独
            case this.GAME_TYPES.MINI6: return 6;    // 矩形数独
            case this.GAME_TYPES.LARGE12: return 12; // 矩形大数独
            case this.GAME_TYPES.LARGE16: return 16; // 大数独
            default: return 9; // 标准、不规则、对角线数独
        }
    }

    getBoxSize() {
        switch (this.type) {
            case this.GAME_TYPES.MINI4: 
                return 2; // 2x2 四宫格
            case this.GAME_TYPES.MINI6: 
                return [2, 3]; // 2x3 矩形宫格
            case this.GAME_TYPES.LARGE12: 
                return [3, 4]; // 3x4 矩形宫格
            case this.GAME_TYPES.LARGE16: 
                return 4; // 4x4 十六宫格
            default: 
                return 3; // 3x3 九宫格（标准、不规则、对角线）
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
        this.initializeGrid();
        this.seed = Date.now();
        
        // 使用时间戳作为随机种子
        const random = () => {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            return this.seed / 233280;
        };

        // 生成完整的解决方案
        this.generateSolution(random);

        // 保存完整解决方案的副本
        this.solution = this.grid.map(row => [...row]);

        // 根据难度和数独类型调整要移除的数字数量
        let cellsToRemove;
        const totalCells = this.size * this.size;
        const difficultyFactors = {
            'easy': this.size <= 9 ? 0.4 : 0.35,
            'medium': this.size <= 9 ? 0.5 : 0.45,
            'hard': this.size <= 9 ? 0.6 : 0.55
        };
        
        cellsToRemove = Math.floor(totalCells * (difficultyFactors[difficulty] || 0.5));

        // 创建位置数组并使用自定义随机函数打乱
        const positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }

        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // 移除数字时确保保持唯一解
        let removed = 0;
        let attempts = 0;
        const maxAttempts = totalCells * 2;

        for (const [row, col] of positions) {
            if (removed >= cellsToRemove || attempts >= maxAttempts) break;
            
            const temp = this.grid[row][col];
            this.grid[row][col] = 0;

            // 检查是否仍然具有唯一解
            if (!this.hasUniqueSolution()) {
                this.grid[row][col] = temp;
            } else {
                removed++;
            }
            attempts++;
        }
    }

    generateSolution(random) {
        const fillGrid = (position = 0) => {
            if (position === this.size * this.size) return true;

            const row = Math.floor(position / this.size);
            const col = position % this.size;

            const numbers = Array.from({length: this.size}, (_, i) => i + 1);
            for (let i = numbers.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }

            for (const num of numbers) {
                if (this.isValid(row, col, num)) {
                    this.grid[row][col] = num;
                    if (fillGrid(position + 1)) return true;
                    this.grid[row][col] = 0;
                }
            }
            return false;
        };

        fillGrid();
    }

    hasUniqueSolution() {
        const tempGrid = this.grid.map(row => [...row]);
        let solutions = 0;
        
        const findSolutions = (row = 0, col = 0) => {
            if (solutions > 1) return;
            
            if (col === this.size) {
                row++;
                col = 0;
            }
            
            if (row === this.size) {
                solutions++;
                return;
            }

            if (this.grid[row][col] !== 0) {
                findSolutions(row, col + 1);
                return;
            }

            for (let num = 1; num <= this.size; num++) {
                if (this.isValid(row, col, num)) {
                    this.grid[row][col] = num;
                    findSolutions(row, col + 1);
                    this.grid[row][col] = 0;
                }
            }
        };

        findSolutions();
        this.grid = tempGrid;
        return solutions === 1;
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
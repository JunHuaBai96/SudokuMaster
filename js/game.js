// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局游戏实例
    window.game = new SudokuGame('large12'); // 设置初始游戏类型为12x12
    // 生成数独谜题
    window.game.generatePuzzle('medium');
    // 创建UI实例，传入游戏实例
    window.ui = new SudokuUI(window.game);

    // 监听游戏类型变化
    document.getElementById('gameType').addEventListener('change', (e) => {
        const type = e.target.value;
        window.game = new SudokuGame(type);
        window.game.generatePuzzle('medium');
        window.ui = new SudokuUI(window.game);
    });
}); 
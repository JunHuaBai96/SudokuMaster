// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局游戏实例
    window.game = new SudokuGame();
    // 创建UI实例
    window.ui = new SudokuUI();
    // 开始新游戏
    window.ui.resetGame();
}); 
# SudokuMaster

一个现代化的数独游戏，支持多种数独类型和难度级别。

![微信图片_20250408233446](https://github.com/user-attachments/assets/c20bbb5b-d52c-428a-befa-3e28aba6b8f3)

## 功能特点

- 支持多种数独类型：
  - 标准数独 (9x9)
  - 迷你数独 (4x4)
  - 迷你数独 (6x6)
  - 大数独 (12x12)
  - 超大数独 (16x16)
- 实时错误检查
- 提示系统
- 计时功能
- 最佳时间记录
- 响应式设计
- 支持键盘输入
- 高亮相关单元格
- 错误提示和震动反馈

## 游戏规则

1. 每行、每列和每个宫格中的数字不能重复
2. 预填数字不能修改
3. 每个数字只能使用一次
4. 你有3次机会可以犯错
5. 可以使用提示功能（共3次）

## 数独类型说明

### 标准数独 (9x9)
- 9x9的网格
- 3x3的宫格
- 使用数字1-9

### 迷你数独 (4x4)
- 4x4的网格
- 2x2的宫格
- 使用数字1-4

### 迷你数独 (6x6)
- 6x6的网格
- 2x3的宫格
- 使用数字1-6

### 大数独 (12x12)
- 12x12的网格
- 3x4的宫格
- 使用数字1-9和字母A-C

### 超大数独 (16x16)
- 16x16的网格
- 4x4的宫格
- 使用数字1-9和字母A-G

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage (用于保存最佳时间)

## 安装和运行

1. 克隆仓库：
```bash
git clone https://github.com/JunHuaBai96/SudokuMaster.git
```

2. 打开 `index.html` 文件即可开始游戏

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 

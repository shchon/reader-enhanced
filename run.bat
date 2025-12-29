@echo off
REM 切换到本项目根目录（根据你的实际路径修改）
cd /d I:\python\lingo-reader-main\reader-html
pnpm dev -- --host 0.0.0.0 --port 5173


REM 保持窗口打开（如果你是双击运行）
pause
# ChatDev Go-React 启动脚本

本目录包含用于启动 ChatDev Go-React 应用程序的启动脚本。

## 脚本说明

### start-all.bat
- **功能**: 启动完整的全栈应用程序（后端 + 前端）
- **使用**: 双击运行或在命令行中执行
- **说明**: 会在新窗口中同时启动后端服务器和前端开发服务器

### start-backend.bat
- **功能**: 仅启动 Go 后端服务器
- **端口**: 8080
- **说明**: 自动安装 Go 依赖并启动服务器

### start-frontend.bat
- **功能**: 仅启动 React 前端开发服务器
- **端口**: 3000
- **说明**: 自动安装 npm 依赖并启动开发服务器

## 使用方法

### 快速启动（推荐）
```
双击 start-all.bat
```

### 分别启动
```
双击 start-backend.bat （启动后端）
双击 start-frontend.bat （启动前端）
```

## 访问地址

- **前端**: http://localhost:3000
- **后端**: http://localhost:8080

## 注意事项

1. 确保已安装 Go 和 Node.js
2. 首次运行可能需要较长时间来安装依赖
3. 后端服务器需要先启动，前端会代理请求到后端
4. 如需停止服务，关闭对应的命令窗口即可
5. 前端依赖安装位置：运行脚本安装 apps/frontend 的依赖时，node_modules 将在项目的 lib 目录中创建（通过目录链接实现），而不是在 apps/frontend 目录下生成。
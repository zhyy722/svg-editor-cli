# SVG Editor CLI — Lab1 Phase 1

Git 仓库：<https://github.com/zhyy722/svg-editor-cli>

最终版本标签：[`final`](https://github.com/zhyy722/svg-editor-cli/tree/final)

**作业提交文档为 [doc/README.md](doc/README.md)**，包含架构方案、过程记录、一致性自查和质量保证手段。

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm cli
```

需要 Node.js 22 或以上、pnpm 10 或以上。也可以使用 `npm install`、`npm run build`、`npm test`、`npm run cli`；锁定依赖的复现方式采用 pnpm。

回放流程图案例：

```sh
pnpm cli --script examples/flowchart.txt
```

生成的 [examples/flowchart.svg](examples/flowchart.svg) 可以直接用浏览器打开。

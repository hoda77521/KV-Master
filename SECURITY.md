# Security Policy

Tap KV 是纯前端应用，Gemini 请求会从用户浏览器直接发出。因此，API Key 的处理方式是本项目最重要的安全边界。

## 当前安全设计

- 不在源码中内置 API Key。
- 不从 `.env` 注入 API Key 到构建产物。
- 不把 API Key 写入 localStorage、sessionStorage 或 cookie。
- API Key 仅保存在当前页面运行时内存中。
- 自定义 API Base URL 默认要求 HTTPS。

## 使用者注意事项

- 只在 HTTPS 页面输入真实 API Key。
- 不要使用不可信的 API 代理。
- 如果使用第三方代理，请确认它如何处理、记录和转发你的 API Key。
- 公共演示站不应该内置共享 API Key。

## 报告安全问题

请不要把真实 API Key、访问令牌或完整敏感日志贴到公开 Issue。

如果你发现安全问题，可以通过 GitHub Issue 提供脱敏后的复现信息，或在 PR 中提交修复建议。

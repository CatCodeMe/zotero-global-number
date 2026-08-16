# Zotero 全局编号

[English](README.en.md)

<img src="addon/icon.svg" width="80" alt="全局编号图标">

一个给 Zotero 9 使用的小插件：为“我的文库”中的常规条目分配全局递增的五位编号（`00001`–`99999`）。

## 功能

- 通过 Zotero Connector 或手动新建的条目会自动编号。
- 条目列表可显示“全局编号”列。
- `工具 → 全局编号`可以查看当前最大编号和下一个编号。
- 可明确执行“为所有未编号条目补充编号”；不会修改标题、标签、分类或附件。
- 换电脑后会从已同步条目中的最大编号继续。

编号写入可同步的 **Extra（其他）** 字段，并使用独立命名空间，不占用 Zotero 原生书目信息字段：

```text
[global-number]
{"version":1,"number":"00001"}
[/global-number]
```

## 安装与更新

从最新的 [GitHub Release](https://github.com/CatCodeMe/zotero-global-number/releases) 下载并安装 XPI。首次安装后，Zotero 可以通过插件管理器自动更新，也可以在“检查更新”中手动更新。

## 维护

修改代码并更新 `addon/manifest.json` 的 `version`。合并到 `main` 后，GitHub Actions 会自动生成 XPI、SHA-256 更新清单和 GitHub Release。

v0.1 不包含 AI 标签功能；插件不会上传条目内容或 API Key。

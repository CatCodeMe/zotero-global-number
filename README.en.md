# Global Number for Zotero

[简体中文](README.md)

<img src="addon/icon.svg" width="80" alt="Global Number icon">

A small Zotero 9 plugin that assigns a unique, increasing five-digit number
(`00001`–`99999`) to regular items in My Library.

## Features

- Numbers new items from the Zotero Connector or manual entry.
- Shows the number in a `Global Number` column.
- Shows the current maximum and next number under `Tools → Global Number`.
- Can explicitly backfill existing unnumbered regular items without changing
  titles, tags, collections, or attachments.
- Continues from the largest synced number on another computer.

Numbers are stored in the syncable **Extra** field as a namespaced block, so
they do not occupy Zotero's built-in bibliographic fields:

```text
[global-number]
{"version":1,"number":"00001"}
[/global-number]
```

## Install and update

Install the XPI from the latest [GitHub Release](https://github.com/CatCodeMe/zotero-global-number/releases).
After the first installation, Zotero can update the plugin from its Plugins
Manager automatically or through **Check for Updates**.

## Development

Change the code and bump `version` in `addon/manifest.json`. A merge to `main`
then creates a versioned XPI, SHA-256 update manifest, and GitHub Release.

AI tagging is intentionally out of scope for v0.1: this plugin does not send
item data or API keys anywhere.

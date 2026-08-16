# Global Number for Zotero

Zotero 9 plugin that gives every new regular item a globally increasing,
five-digit number (`00001`–`99999`). It does not alter titles, tags,
collections, attachments, or existing Zotero fields.

The number is stored in the standard, syncable **Extra** field as a small
namespaced JSON block:

```
[global-number]
{"version":1,"number":"00001"}
[/global-number]
```

## Behavior

- Chrome Connector and manual additions are handled by the same Zotero item-add
  event.
- All new regular items in My Library are numbered; collection placement stays
  entirely under your control.
- `Tools → 全局编号 → 查看全局编号状态` shows the maximum and next number.
- On a new computer, the plugin scans the synced Extra blocks and
  continues from the maximum.
- The `全局编号` custom column displays the parsed number without exposing the
  JSON storage block in the item list.

## Current status

This is an early public alpha. The XPI manifest includes Zotero 9's required
`applications.zotero.update_url`, and `updates.json` publishes a matching
SHA-256 checksum for the package. The installer and live UI still require
Zotero 9 verification before this should be treated as a stable release.

## AI tags

AI tagging is deliberately not included in v0.1. It will require an explicit
provider configuration, review-before-apply UI, and a small documented taxonomy.
No API key or item text is sent anywhere in this release.

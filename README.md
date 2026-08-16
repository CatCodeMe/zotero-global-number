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
- `Tools → 全局编号 → 为所有未编号条目补充编号` is an explicit one-time
  backfill: it affects only regular items in My Library, preserves existing
  numbers, and never changes titles, tags, collections, or attachments.
- On a new computer, the plugin scans the synced Extra blocks and
  continues from the maximum.
- The `全局编号` custom column displays the parsed number without exposing the
  JSON storage block in the item list.

## Install and update

Install the `.xpi` from the latest [GitHub Release](https://github.com/CatCodeMe/zotero-global-number/releases).
After installation Zotero checks the release update manifest itself. The plugin
does not need to be reinstalled manually for ordinary upgrades.

## Maintainer release flow

The repository is the only source of truth.

1. Make and test a change on a branch.
2. Update `addon/manifest.json`'s semantic `version` (for example `0.1.2` to
   `0.1.3`) as part of the change.
3. Merge it into `main`.

GitHub Actions then builds the XPI, calculates its SHA-256 update checksum,
creates the matching `vX.Y.Z` GitHub Release, and publishes its `updates.json`.
The checked-in `updates.json` is updated only as a compatibility bridge for
early installations that still read the old raw-GitHub update URL. All released
versions use GitHub Releases' stable `latest/download/updates.json` endpoint.

Do not reuse an already released version: the workflow deliberately skips an
existing tag, which makes releases traceable and prevents replacing an XPI that
clients may already have verified.

## AI tags

AI tagging is deliberately not included in v0.1. It will require an explicit
provider configuration, review-before-apply UI, and a small documented taxonomy.
No API key or item text is sent anywhere in this release.

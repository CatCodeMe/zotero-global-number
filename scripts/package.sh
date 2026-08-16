#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
mkdir -p "$root/dist"
rm -f "$root/dist/reading-queue-numbers.xpi"
(cd "$root/addon" && zip -qr "$root/dist/reading-queue-numbers.xpi" .)

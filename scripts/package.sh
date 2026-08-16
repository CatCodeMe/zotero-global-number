#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
output=${1:-"$root/dist/reading-queue-numbers.xpi"}
mkdir -p "$(dirname -- "$output")"
rm -f "$output"
(cd "$root/addon" && zip -X -qr "$output" .)

#!/bin/sh
set -eu

version=$1
update_link=$2
xpi_path=$3
output=$4
hash=$(shasum -a 256 "$xpi_path" | awk '{print $1}')

mkdir -p "$(dirname -- "$output")"
printf '%s\n' '{' \
  '  "addons": {' \
  '    "reading-queue-numbers@catcodeme.github.io": {' \
  '      "updates": [' \
  '        {' \
  "          \"version\": \"$version\", " \
  "          \"update_link\": \"$update_link\", " \
  "          \"update_hash\": \"sha256:$hash\", " \
  '          "applications": {' \
  '            "zotero": {' \
  '              "strict_min_version": "9.0",' \
  '              "strict_max_version": "*"' \
  '            }' \
  '          }' \
  '        }' \
  '      ]' \
  '    }' \
  '  }' \
  '}' > "$output"

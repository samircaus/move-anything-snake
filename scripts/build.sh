#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

npm run check
npm test

rm -rf dist
mkdir -p dist/snake
cp src/module.json src/game-v0.2.4.mjs src/music-v0.4.0.mjs src/help.json LICENSE dist/snake/
cp src/ui.js dist/snake/ui-v0.4.1.js
COPYFILE_DISABLE=1 tar -czf dist/snake-module.tar.gz -C dist snake

printf '%s\n' 'Built dist/snake-module.tar.gz'

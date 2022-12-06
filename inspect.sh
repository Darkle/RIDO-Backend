#!/usr/bin/env bash

if [ $# -eq 0 ]; then
    printf "🚨⚠️  No arguments provided! ⚠️ 🚨\n\n"
    exit 1
fi

if [[ "$*" == *"image"* ]]; then
  cd services/image-processing && pnpm run inspect
fi

if [[ "$*" == *"update"* ]]; then
  cd services/updates && pnpm run inspect
fi

if [[ "$*" == *"download"* ]]; then
  cd services/downloads && pnpm run inspect
fi

if [[ "$*" == *"api"* ]]; then
  cd services/api && pnpm run inspect
fi

if [[ "$*" == *"cleanup"* ]]; then
  cd services/cleanup && pnpm run inspect
fi




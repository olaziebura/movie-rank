#!/bin/bash

find src -name "*.ts" -o -name "*.tsx" | while read file; do
  if [ -f "$file" ]; then
    # Remove logger imports
    sed -i '' '/import.*logger.*from/d' "$file"
    sed -i '' '/import { logger }/d' "$file"
    
    # Remove logger calls
    sed -i '' '/logger\./d' "$file"
    
    # Remove all comments
    sed -i '' '/^[[:space:]]*\/\//d' "$file"
    sed -i '' '/^[[:space:]]*\/\*/,/\*\//d' "$file"
    sed -i '' 's/\/\*.*\*\///g' "$file"
    sed -i '' 's/\/\/.*$//' "$file"
    
    echo "Cleaned: $file"
  fi
done

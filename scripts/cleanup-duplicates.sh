#!/bin/bash

# Script za cleanup duplikata u projektu
# Usage: ./scripts/cleanup-duplicates.sh [--dry-run] [--backup]

set -e

DRY_RUN=false
BACKUP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --backup)
      BACKUP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--backup]"
      exit 1
      ;;
  esac
done

echo "🧹 Collector Project Cleanup Script"
echo "===================================="
echo ""

# Check if shadcn-dashboard-template exists
if [ -d "shadcn-dashboard-template" ]; then
    SIZE=$(du -sh "shadcn-dashboard-template" 2>/dev/null | cut -f1)
    echo "📦 Found duplicate: shadcn-dashboard-template/ ($SIZE)"
    
    if [ "$BACKUP" = true ]; then
        echo "💾 Creating backup..."
        if [ "$DRY_RUN" = false ]; then
            tar -czf "shadcn-backup-$(date +%Y%m%d-%H%M%S).tar.gz" "shadcn-dashboard-template/"
            echo "✅ Backup created: shadcn-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        else
            echo "   [DRY RUN] Would create backup"
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo "   [DRY RUN] Would remove: shadcn-dashboard-template/"
        echo "   [DRY RUN] Would update .gitignore"
    else
        echo "🗑️  Removing from git tracking..."
        git rm -r --cached "shadcn-dashboard-template/" 2>/dev/null || echo "   Already removed from git"
        
        echo "📝 .gitignore already updated (should contain shadcn-dashboard-template/)"
        
        echo ""
        echo "⚠️  Note: Folder still exists locally. Remove manually if desired:"
        echo "   rm -rf shadcn-dashboard-template/"
    fi
else
    echo "✅ No duplicate shadcn-dashboard-template/ found"
fi

echo ""
echo "📊 Checking for other cleanup opportunities..."

# Check for large node_modules
echo ""
echo "Node modules folders found:"
find . -type d -name "node_modules" -prune -exec du -sh {} \; 2>/dev/null | sort -hr | head -10

# Check for build artifacts
echo ""
echo "Build artifacts found:"
find . -type d \( -name ".next" -o -name "dist" -o -name "build" \) -prune -exec du -sh {} \; 2>/dev/null | head -10

echo ""
echo "✅ Cleanup check complete!"
echo ""
echo "Recommendations:"
echo "1. Review and remove unused node_modules (consider monorepo)"
echo "2. Clean build artifacts if not needed"
echo "3. Run 'git gc' to optimize repository after cleanup"


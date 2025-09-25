#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Branch-Internal Rebase Strategy ===${NC}"
echo "Phase 1: Reorganize commits within current branch (no conflicts)"
echo "Phase 2: Rebase organized commits onto master (minimal conflicts)"
echo

# Verify we're on the right branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "vpn-integration" ]; then
    echo -e "${RED}Error: Not on vpn-integration branch. Currently on: $current_branch${NC}"
    exit 1
fi

# Get all commits in this branch (67 commits)
commits=($(git log --reverse --format="%H" HEAD~67..HEAD))
commit_count=${#commits[@]}

echo "Branch: $current_branch"
echo "Commits to reorganize: $commit_count"
echo "Range: HEAD~67..HEAD"
echo "First: $(git log --format="%h %s" -n 1 ${commits[0]})"
echo "Last:  $(git log --format="%h %s" -n 1 ${commits[66]})"
echo

# Create rebase instructions for branch-internal reorganization
rebase_file=$(mktemp)

echo -e "${YELLOW}Creating rebase instructions for 6 groups...${NC}"

cat > "$rebase_file" << EOF
# Group 1: SPA Monitoring Foundation (commits 0-19)
pick ${commits[0]}
$(for i in {1..19}; do echo "squash ${commits[$i]}"; done)

# Group 2: Site-specific Improvements (commits 20-34)
pick ${commits[20]}
$(for i in {21..34}; do echo "squash ${commits[$i]}"; done)

# Group 3: CI Geographic & Debugging (commits 35-49)
pick ${commits[35]}
$(for i in {36..49}; do echo "squash ${commits[$i]}"; done)

# Group 4: VPN Integration (commits 50-59)
pick ${commits[50]}
$(for i in {51..59}; do echo "squash ${commits[$i]}"; done)

# Group 5: Test Organization (commits 60-64)
pick ${commits[60]}
$(for i in {61..64}; do echo "squash ${commits[$i]}"; done)

# Group 6: Final Configuration (commits 65-66)
pick ${commits[65]}
squash ${commits[66]}
EOF

echo -e "${YELLOW}Preview of rebase instructions:${NC}"
head -15 "$rebase_file"
echo "..."
echo "(Total groups: 6)"
echo

read -p "Execute branch-internal rebase? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    rm -f "$rebase_file"
    echo "Aborted."
    exit 0
fi

echo -e "${YELLOW}Executing branch-internal rebase...${NC}"
echo "This should not have conflicts since we're staying within the same branch."

GIT_SEQUENCE_EDITOR="cp $rebase_file" git rebase -i HEAD~67

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Phase 1 completed successfully!${NC}"
    final_count=$(git rev-list --count HEAD~$(git rev-list --count origin/master..HEAD)..HEAD)
    echo "Commits after reorganization: $(git rev-list --count origin/master..HEAD)"
    echo
    echo "New commit history:"
    git log --oneline origin/master..HEAD
    echo
    echo -e "${BLUE}Ready for Phase 2: Rebase onto master${NC}"
    echo "Run: git rebase origin/master"
else
    echo -e "${RED}❌ Phase 1 failed${NC}"
    echo "To abort: git rebase --abort"
fi

# Clean up
rm -f "$rebase_file"
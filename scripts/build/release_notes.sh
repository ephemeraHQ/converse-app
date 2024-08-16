#!/bin/bash

# Ensure two commit hashes are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <start-commit> <end-commit>"
    exit 1
fi

START_COMMIT=$1
END_COMMIT=$2

# Get commit messages from START_COMMIT to END_COMMIT (excluding START_COMMIT)
git log --no-merges --pretty=format:"%s" $START_COMMIT..$END_COMMIT

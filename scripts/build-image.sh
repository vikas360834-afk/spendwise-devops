#!/bin/bash
set -e
rm -rf ~/spendwise
mkdir -p ~/spendwise
git -C /mnt/c/Users/dell/Downloads/spendwise-ai archive HEAD | tar -x -C ~/spendwise
cd ~/spendwise
echo "context files: $(find . -type f | wc -l)"
docker build --progress=plain -t spendwise-ai:1.0.0 . > /tmp/docker-build.log 2>&1
echo "BUILD_OK"
docker images --format '{{.Repository}}:{{.Tag}} {{.Size}} {{.ID}}' | grep spendwise
tail -12 /tmp/docker-build.log

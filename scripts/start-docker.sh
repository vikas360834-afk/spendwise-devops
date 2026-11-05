#!/bin/bash
pkill dockerd 2>/dev/null || true
sleep 1
nohup dockerd > /var/log/dockerd.log 2>&1 &
for i in $(seq 1 90); do
  if docker info >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! docker info >/dev/null 2>&1; then
  echo "DOCKERD_FAILED"
  tail -30 /var/log/dockerd.log
  exit 1
fi
docker info --format 'server={{.ServerVersion}} driver={{.Driver}} cgroup={{.CgroupVersion}} root={{.DockerRootDir}}'
docker run --rm hello-world | tail -5

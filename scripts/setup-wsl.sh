#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
printf 'Acquire::ForceIPv4 "true";\n' > /etc/apt/apt.conf.d/99force-ipv4
apt-get update -qq
apt-get install -y -qq --no-install-recommends \
  ca-certificates curl gnupg git iptables iproute2 conntrack socat jq tar gzip \
  docker.io ansible-core > /tmp/apt.log 2>&1
echo "APT_OK"
docker --version
ansible --version | head -2

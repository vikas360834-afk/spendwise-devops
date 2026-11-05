#!/bin/bash
set -e
mkdir -p ~/.kube
docker exec spendwise-control-plane cat /etc/kubernetes/admin.conf > ~/.kube/config
sed -i 's#server: https://[^ ]*#server: https://127.0.0.1:43879#' ~/.kube/config
kubectl get nodes -o wide || true
curl -fsSL -o /tmp/kube-flannel.yml https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
kubectl apply -f /tmp/kube-flannel.yml
kubectl taint nodes spendwise-control-plane node-role.kubernetes.io/control-plane:NoSchedule- 2>/dev/null || true
for i in $(seq 1 90); do
  st=$(kubectl get nodes --no-headers 2>/dev/null | awk '{print $2}')
  echo "node status: $st"
  [ "$st" = "Ready" ] && break
  sleep 4
done
kubectl get nodes -o wide
kubectl get pods -A

#!/bin/bash
set -e
curl -fsSL -o /usr/local/bin/kind https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-amd64
chmod +x /usr/local/bin/kind
curl -fsSL -o /usr/local/bin/kubectl https://dl.k8s.io/release/v1.37.2/bin/linux/amd64/kubectl
chmod +x /usr/local/bin/kubectl
echo "kind: $(kind version)"
echo "kubectl: $(kubectl version --client=true --output=yaml 2>/dev/null | grep gitVersion | head -1)"
kind create cluster --name spendwise --wait 420s
kubectl cluster-info
kubectl get nodes -o wide

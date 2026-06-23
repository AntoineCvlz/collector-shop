#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Provisioning d'un VPS Ubuntu pour Collector Shop (production).
# À exécuter UNE FOIS, en root, sur un VPS fraîchement créé.
#
#   curl -fsSL .../provision-vps.sh | DEPLOY_PUBKEY="ssh-ed25519 AAAA..." bash
# ou copier le fichier puis :  DEPLOY_PUBKEY="ssh-ed25519 AAAA..." bash provision-vps.sh
#
# Variable requise :
#   DEPLOY_PUBKEY = la clé PUBLIQUE de déploiement (~/.ssh/collector_deploy.pub)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "❌ À lancer en root." >&2
  exit 1
fi
if [[ -z "${DEPLOY_PUBKEY:-}" ]]; then
  echo "❌ DEPLOY_PUBKEY (clé publique de déploiement) est requise." >&2
  exit 1
fi

echo "▶ 1/5 Utilisateur deploy"
id deploy &>/dev/null || adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
grep -qxF "${DEPLOY_PUBKEY}" /home/deploy/.ssh/authorized_keys 2>/dev/null \
  || echo "${DEPLOY_PUBKEY}" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys

echo "▶ 2/5 Docker + Compose"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker deploy

echo "▶ 3/5 Firewall (ufw : 22 + 80)"
apt-get update -y && apt-get install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw --force enable

echo "▶ 4/5 Dossier de déploiement"
install -d -o deploy -g deploy /opt/collector-shop

echo "▶ 5/5 Durcissement SSH (désactive login root par mot de passe)"
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh || systemctl restart sshd || true

echo "✅ VPS provisionné."
docker --version && docker compose version
echo "→ Étape suivante : créer /opt/collector-shop/.env (cf. docker/.env.prod.example)"

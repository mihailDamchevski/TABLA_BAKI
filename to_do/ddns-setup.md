# DDNS setup to make SSH stable

This task still needs to be completed. Deployment works only if the host resolves to your current server IP.

## Recommended setup

1. Create a dedicated SSH DNS record:
   - `ssh.tablabaki.com` -> your server public IP
   - Set it to **DNS only** (Cloudflare gray cloud), not proxied.
2. Keep port forwarding active:
   - Forward external port `22` to your server internal IP port `22`.
3. Configure Dynamic DNS updates:
   - Use your router DDNS client, or
   - Run a DDNS updater on the server that updates Cloudflare DNS when IP changes.
4. Validate SSH from outside your network:
   - `ssh user@ssh.tablabaki.com`
5. Update GitHub repository secrets to match workflow:
   - `HOST` = `ssh.tablabaki.com`
   - `USERNAME` = server SSH user
   - `KEY` = private key for that user
   - `PORT` = `22`

## Why this is needed

- You have a dynamic public IP.
- If DNS is not updated, GitHub Actions tries to SSH to an old IP and deployment fails.
- Cloudflare proxied DNS does not support direct SSH on port 22 for this setup.

## If direct SSH still fails

Check whether ISP uses CGNAT. If yes, inbound port forwarding may not work.

Fallback options:
- Use Tailscale and SSH via Tailscale address.
- Use Cloudflare Access/Tunnel for SSH.
- Use a VPS jump host with static IP.

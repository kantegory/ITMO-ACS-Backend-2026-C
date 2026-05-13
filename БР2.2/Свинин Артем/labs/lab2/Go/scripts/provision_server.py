#!/usr/bin/env python3
import argparse
import os
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

def run(cmd: list[str], check: bool = True) -> int:
    logging.debug(" ".join(cmd))
    res = subprocess.run(cmd)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return res.returncode


def install_packages():
    run(["apt", "update"])
    run(["apt", "upgrade", "-y"])
    run([
        "apt", "install", "-y",
        "curl", "git", "ufw", "nginx", "fail2ban",
        "ca-certificates", "gnupg", "lsb-release",
        "certbot", "python3-certbot-nginx"
    ])


def install_docker():
    if shutil.which("docker") is None:
        run(["curl", "-fsSL", "https://get.docker.com", "-o", "/tmp/get-docker.sh"])
        run(["sh", "/tmp/get-docker.sh"])
        run(["rm", "-f", "/tmp/get-docker.sh"])

    run(["apt", "install", "-y", "docker-compose-plugin"], check=False)
    run(["systemctl", "enable", "--now", "docker"], check=False)

    return shutil.which("docker") or "/usr/bin/docker"


def configure_firewall():
    run(["ufw", "allow", "OpenSSH"], check=False)
    run(["ufw", "allow", "Nginx Full"], check=False)
    run(["ufw", "--force", "enable"], check=False)


def configure_fail2ban():
    Path("/etc/fail2ban/jail.d").mkdir(parents=True, exist_ok=True)
    Path("/etc/fail2ban/jail.d/sshd.local").write_text(
        "[sshd]\nenabled = true\nmaxretry = 5\n"
    )
    run(["systemctl", "enable", "--now", "fail2ban"], check=False)


def configure_nginx(domain: str, port: str):
    server_name = domain or "_"

    cfg = f"""
server {{
    listen 80;
    server_name {server_name};

    location / {{
        proxy_pass http://localhost:{port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }}
}}
"""

    Path("/etc/nginx/sites-available/app").write_text(cfg)
    run(["ln", "-sfn",
         "/etc/nginx/sites-available/app",
         "/etc/nginx/sites-enabled/app"])

    run(["rm", "-f", "/etc/nginx/sites-enabled/default"], check=False)
    run(["nginx", "-t"])
    run(["systemctl", "reload", "nginx"])


def certbot(domain: str, email: str):
    if not domain or not email:
        logging.info("skip certbot")
        return

    run([
        "certbot", "--nginx",
        "--non-interactive",
        "--agree-tos",
        "--redirect",
        "-m", email,
        "-d", domain
    ], check=False)


def deploy(repo: str, branch: str, user: str, project: Path, port: str, docker: str):

    releases = project / "releases"
    releases.mkdir(parents=True, exist_ok=True)

    shared = project / "shared"
    shared.mkdir(parents=True, exist_ok=True)
    env_file = shared / ".env"

    if not env_file.exists():
        for c in [project / ".env", project / ".env.example"]:
            if c.exists():
                shutil.copy2(c, env_file)
                break

    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    new_release = releases / ts

    logging.info(f"clone -> {new_release}")
    run(["sudo", "-u", user, "git", "clone", "--branch", branch, repo, str(new_release)])

    current = project / "current"
    old = current.resolve() if current.is_symlink() else None

    compose = new_release / "docker-compose.yml"
    if not compose.exists():
        raise RuntimeError("missing docker-compose.yml")

    run([
        docker, "compose",
        "--env-file", str(env_file),
        "-p", "rental-platform",
        "-f", str(compose),
        "up", "-d", "--build"
    ], check=False)

    healthy = False
    for i in range(12):
        logging.info(f"health {i+1}")
        if run(["curl", "-fsS", f"http://localhost:{port}/health"], check=False) == 0:
            healthy = True
            break
        time.sleep(5)

    if not healthy:
        logging.error("rollback")
        run([
            docker, "compose",
            "--env-file", str(env_file),
            "-p", "rental-platform",
            "-f", str(compose),
            "down"
        ], check=False)

        if old:
            run(["ln", "-sfn", str(old), str(current)])
        return

    # switch only AFTER success
    run(["ln", "-sfn", str(new_release), str(current)])

    if old:
        logging.info("old release kept for rollback")

def systemd(docker: str, project: Path):
    Path("/etc/systemd/system/rental-platform.service").write_text(f"""
[Unit]
Description=Rental Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory={project / 'current'}
ExecStart={docker} compose -p rental-platform up -d --build
ExecStop={docker} compose -p rental-platform down

[Install]
WantedBy=multi-user.target
""")

    run(["systemctl", "daemon-reload"])
    run(["systemctl", "enable", "rental-platform"])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("repo")
    p.add_argument("--branch", default="main")
    p.add_argument("--user", default="deploy")
    p.add_argument("--dir", default="/opt/rental-platform")
    p.add_argument("--port", default="8080")
    p.add_argument("--domain", default="")
    p.add_argument("--email", default="")
    args = p.parse_args()

    if os.geteuid() != 0:
        raise SystemExit("run as root")

    install_packages()
    configure_firewall()
    install_docker()
    configure_fail2ban()

    project = Path(args.dir)
    project.mkdir(parents=True, exist_ok=True)

    deploy(args.repo, args.branch, args.user, project, args.port, shutil.which("docker"))

    configure_nginx(args.domain, args.port)
    certbot(args.domain, args.email)
    systemd(shutil.which("docker"), project)

    logging.info("DONE")


if __name__ == "__main__":
    main()
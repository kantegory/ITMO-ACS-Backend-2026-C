from pathlib import Path
import os
import secrets

root = Path(__file__).resolve().parents[2]
env = root / '.env'
values = {}
if env.exists():
    values = dict(line.split('=', 1) for line in env.read_text().splitlines() if line and not line.startswith('#') and '=' in line)
for key in ['DB_PASSWORD', 'RABBIT_PASSWORD', 'JWT_SECRET', 'INTERNAL_KEY']:
    values.setdefault(key, secrets.token_hex(24))
values.setdefault('HTTP_BIND', '127.0.0.1')
values.setdefault('HTTP_PORT', '8080')
values.setdefault('DOCKER_SUBNET', '172.30.80.0/24')
values['LOCAL_UID'] = str(os.getuid())
values['LOCAL_GID'] = str(os.getgid())
env.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
env.chmod(0o600)
(root / '.run').mkdir(exist_ok=True)
print('Environment ready. Existing passwords preserved; values are in .env.')

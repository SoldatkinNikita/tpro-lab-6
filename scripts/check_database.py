"""Execute DDL and constraint checks in a new, disposable local PostgreSQL cluster."""
from __future__ import annotations

import json
import socket
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BIN = Path(r'P:\Programs\PostgreSQL\bin')


def main() -> None:
    build = ROOT / 'build'
    build.mkdir(exist_ok=True)
    data = Path(tempfile.mkdtemp(prefix='lab6-pg-', dir=build))
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    output = []

    def run(name: str, *args: str) -> str:
        print('Running '+name, flush=True)
        log_path = build / ('pg-command-'+name+'.txt')
        with log_path.open('wb') as log:
            result = subprocess.run([str(BIN / (name+'.exe')), *map(str, args)],
                                    cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, timeout=90)
        text = log_path.read_text(encoding='utf-8', errors='replace')
        output.append('$ '+name+' '+' '.join(map(str,args))+'\n'+text)
        if result.returncode:
            raise RuntimeError(output[-1])
        return text

    started = False
    try:
        version = run('postgres', '--version').strip()
        run('initdb', '-D', str(data), '-U', 'lab6', '-A', 'trust', '-E', 'UTF8', '--locale=C')
        run('pg_ctl', '-D', str(data), '-l', str(data / 'server.log'), '-o', f'-h 127.0.0.1 -p {port}', '-w', 'start')
        started = True
        base = ['-X', '-h', '127.0.0.1', '-p', str(port), '-U', 'lab6', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
        run('psql', *base, '-f', str(ROOT / 'lab6/sql/aria.sql'))
        checks = run('psql', *base, '-f', str(ROOT / 'lab6/sql/verify.sql'))
        assert checks.count('PASS expected SQLSTATE') == 18, checks
        result = {'status': 'passed', 'server': version, 'isolatedCluster': True,
                  'tables': 12, 'expectedConstraintFailures': 18,
                  'positiveChecks': ['valid inserts', 'audio/file/tag join', 'terminal status',
                                     'cascade deletion', 'deferred 1:1 checks']}
        (ROOT / 'lab6/validation/postgresql.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
        print(json.dumps(result))
    finally:
        if started:
            run('pg_ctl', '-D', str(data), '-m', 'fast', '-w', 'stop')
        (ROOT / 'lab6/validation/postgresql.log').write_text('\n'.join(output), encoding='utf-8')


if __name__ == '__main__':
    main()

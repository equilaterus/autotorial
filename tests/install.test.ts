import {mkdtemp, mkdir, readFile, readlink, writeFile, copyFile, chmod, symlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';

const framework = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('host integration scripts', () => {
  it('installs relative skill/CLI links idempotently and preserves host files', async () => {
    const host = await mkdtemp(path.join(os.tmpdir(), 'autotorial-host-'));
    execFileSync('git', ['init', '-q', host], {stdio: 'pipe'});
    await writeFile(path.join(host, '.gitignore'), '# host rules\n');
    await mkdir(path.join(host, '.github', 'workflows'), {recursive: true});
    await writeFile(path.join(host, '.github', 'workflows', 'checks.yml'), 'name: Host checks\n');
    execFileSync(path.join(framework, 'install.sh'), ['--host', host]);
    execFileSync(path.join(framework, 'install.sh'), ['--host', host]);
    const link = await readlink(path.join(host, '.agents', 'skills', 'create-content'));
    expect(path.isAbsolute(link)).toBe(false);
    const cliLink = await readlink(path.join(host, '.autotorial', 'autotorial'));
    expect(path.isAbsolute(cliLink)).toBe(false);
    const deployLink = await readlink(path.join(host, '.autotorial', 'deploy-pages'));
    expect(path.isAbsolute(deployLink)).toBe(false);
    expect(deployLink).toContain('run/deploy-pages.sh');
    expect(await readFile(path.join(host, '.gitignore'), 'utf8')).toBe('# host rules\n/bin/\n');
    expect(await readFile(path.join(host, '.github', 'workflows', 'checks.yml'), 'utf8')).toBe('name: Host checks\n');
    await expect(readFile(path.join(host, '.github', 'workflows', 'autotorial-pages.yml'), 'utf8')).rejects.toThrow();
  });

  it('migrates installer-owned legacy links to autotorial', async () => {
    const host = await mkdtemp(path.join(os.tmpdir(), 'autotorial-migration-host-'));
    execFileSync('git', ['init', '-q', host], {stdio: 'pipe'});
    await mkdir(path.join(host, '.agents', 'skills'), {recursive: true});
    await mkdir(path.join(host, '.claude', 'skills'), {recursive: true});
    await mkdir(path.join(host, '.aitutorial'), {recursive: true});
    for (const skill of ['create-content', 'produce-session', 'voice', 'publish-session']) {
      await symlink(`../../lib/aitutorial/skills/${skill}`, path.join(host, '.agents', 'skills', skill));
      await symlink(`../../lib/aitutorial/skills/${skill}`, path.join(host, '.claude', 'skills', skill));
    }
    await symlink('../lib/aitutorial/dist/cli.js', path.join(host, '.aitutorial', 'aitutorial'));

    execFileSync(path.join(framework, 'install.sh'), ['--host', host]);

    const migratedSkill = await readlink(path.join(host, '.agents', 'skills', 'create-content'));
    expect(migratedSkill).toContain('autotorial/skills/create-content');
    expect(migratedSkill).not.toContain('aitutorial');
    expect(await readlink(path.join(host, '.autotorial', 'autotorial'))).toContain('dist/cli.js');
    await expect(readlink(path.join(host, '.aitutorial', 'aitutorial'))).rejects.toThrow();
  });

  it('runs the deployment check from the installed symlink', async () => {
    const standalone = await mkdtemp(path.join(os.tmpdir(), 'autotorial-deploy-link-'));
    const runDir = path.join(standalone, 'run');
    const binDir = path.join(standalone, 'bin');
    const fakeBin = path.join(standalone, 'fake-bin');
    await mkdir(path.join(standalone, '.autotorial'), {recursive: true});
    await mkdir(path.join(binDir, 'video'), {recursive: true});
    await mkdir(runDir, {recursive: true});
    await mkdir(fakeBin, {recursive: true});
    await copyFile(path.join(framework, 'run', 'deploy-pages.sh'), path.join(runDir, 'deploy-pages.sh'));
    await chmod(path.join(runDir, 'deploy-pages.sh'), 0o755);
    await symlink('../run/deploy-pages.sh', path.join(standalone, '.autotorial', 'deploy-pages'));
    await writeFile(path.join(binDir, 'index.html'), '<script src="./app.js"></script>\n');
    await writeFile(path.join(binDir, 'course.json'), '{}\n');
    await writeFile(path.join(binDir, 'video', 'lesson.mp4'), 'fixture\n');
    await writeFile(path.join(fakeBin, 'ffprobe'), '#!/usr/bin/env bash\necho audio\n');
    await writeFile(path.join(fakeBin, 'ffmpeg'), '#!/usr/bin/env bash\necho "mean_volume: -20.0 dB" >&2\n');
    await chmod(path.join(fakeBin, 'ffprobe'), 0o755);
    await chmod(path.join(fakeBin, 'ffmpeg'), 0o755);

    const output = execFileSync(path.join(standalone, '.autotorial', 'deploy-pages'), ['--check-only'], {
      encoding: 'utf8',
      env: {...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ''}`},
    });
    expect(output).toContain(`Validated local Pages snapshot in ${binDir}`);
  });

  it('plans a revision-selecting update without changing repositories', async () => {
    const host = await mkdtemp(path.join(os.tmpdir(), 'autotorial-update-host-'));
    const frameworkCopy = path.join(host, 'lib', 'autotorial');
    await mkdir(frameworkCopy, {recursive: true});
    await copyFile(path.join(framework, 'update.sh'), path.join(frameworkCopy, 'update.sh'));
    await writeFile(path.join(frameworkCopy, 'install.sh'), '#!/usr/bin/env bash\nexit 0\n');
    await chmod(path.join(frameworkCopy, 'update.sh'), 0o755);
    execFileSync('git', ['init', '-q', host], {stdio: 'pipe'});
    execFileSync('git', ['init', '-q', frameworkCopy], {stdio: 'pipe'});
    execFileSync('git', ['-C', frameworkCopy, 'add', '.'], {stdio: 'pipe'});
    execFileSync('git', ['-C', frameworkCopy, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'fixture'], {stdio: 'pipe'});
    const output = execFileSync(path.join(frameworkCopy, 'update.sh'), ['v1.2.3', '--dry-run', '--host', host], {encoding: 'utf8'});
    expect(output).toContain('checkout --detach v1.2.3');
  });
});

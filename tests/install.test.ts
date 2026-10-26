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
    execFileSync(path.join(framework, 'install.sh'), ['--host', host]);
    execFileSync(path.join(framework, 'install.sh'), ['--host', host]);
    const link = await readlink(path.join(host, '.agents', 'skills', 'create-content'));
    expect(path.isAbsolute(link)).toBe(false);
    const cliLink = await readlink(path.join(host, '.autotorial', 'autotorial'));
    expect(path.isAbsolute(cliLink)).toBe(false);
    expect(await readFile(path.join(host, '.gitignore'), 'utf8')).toBe('# host rules\n/bin/\n');
    const workflow = await readFile(path.join(host, '.github', 'workflows', 'autotorial-pages.yml'), 'utf8');
    expect(workflow).toContain('upload-pages-artifact');
    expect(workflow).toContain('lib/autotorial/dist/cli.js');
    expect(workflow).not.toContain('aitutorial');
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

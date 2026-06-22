import { describe, expect, it } from 'vitest';
import { defaultHostConfig } from '../hostDefaults';
import { substitute, substituteCommands } from '../substitute';

describe('substitute', () => {
  it('replaces OS_USER and MGMT_IP', () => {
    const config = defaultHostConfig();
    const out = substitute('ssh {{OS_USER}}@{{MGMT_IP}}', config);
    expect(out).toContain('splunkuser');
    expect(out).toContain('10.0.0.10');
    expect(out).not.toContain('{{MGMT_IP}}');
  });

  it('aliases SH1 and IDX1 to combined host for single profile', () => {
    const config = defaultHostConfig();
    const mgmt = config.hosts.find((h) => h.role === 'mgmt')!;
    const out = substitute('{{SH1_HOST}} {{IDX1_HOST}} {{DS_IP}}', config, {}, 'single');
    expect(out).toContain(mgmt.hostname);
    expect(out).not.toContain('splunk-sh01');
    expect(out).not.toContain('splunk-idx01');
    expect(out).toContain(mgmt.ip);
  });

  it('aliases DS to mgmt for distributed_nc', () => {
    const config = defaultHostConfig();
    const mgmt = config.hosts.find((h) => h.role === 'mgmt')!;
    const out = substitute('{{DS_IP}}', config, {}, 'distributed_nc');
    expect(out).toBe(mgmt.ip);
  });

  it('scopes IDX_RECEIVING_LIST to profile indexers', () => {
    const config = defaultHostConfig();
    const single = substitute('{{IDX_RECEIVING_LIST}}', config, {}, 'single');
    expect(single).toBe('10.0.0.10:9997');
    const nc = substitute('{{IDX_RECEIVING_LIST}}', config, {}, 'distributed_nc');
    expect(nc).toBe('10.0.0.11:9997');
    const ic = substitute('{{IDX_RECEIVING_LIST}}', config, {}, 'distributed_ic');
    expect(ic).toContain('10.0.0.11:9997');
    expect(ic).toContain('10.0.0.13:9997');
  });

  it('replaces indexer list for outputs.conf', () => {
    const config = defaultHostConfig();
    const out = substitute('server={{IDX_RECEIVING_LIST}}', config);
    expect(out).toContain('10.0.0.11:9997');
    expect(out).toContain('10.0.0.13:9997');
  });

  it('does not leave lab password literals in defaults', () => {
    const config = defaultHostConfig();
    const cmds = substituteCommands(['# password: {{ADMIN_PASSWORD}}'], config);
    expect(cmds[0]).not.toContain('ExpertInsight');
  });
});

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

import { describe, expect, it } from 'vitest';
import { osPrepSteps } from '../steps/osPrep';
import type { GuideBlock, LinuxDistro } from '../types';

function blockVisible(block: GuideBlock, distro: LinuxDistro): boolean {
  if (!block.distros?.length) return true;
  return block.distros.includes(distro);
}

describe('guideDistro', () => {
  const step = osPrepSteps[0];

  it('includes RHEL firewalld blocks for rhel only', () => {
    const firewalld = step.blocks.find((b) => b.contentKey === 'steps.os-prep.blocks.firewalld-ports');
    expect(firewalld?.distros).toEqual(['rhel']);
    expect(blockVisible(firewalld!, 'rhel')).toBe(true);
    expect(blockVisible(firewalld!, 'ubuntu')).toBe(false);
  });

  it('includes ufw blocks for ubuntu and debian', () => {
    const ufw = step.blocks.find((b) => b.contentKey === 'steps.os-prep.blocks.ufw-ports');
    expect(ufw?.distros).toEqual(['ubuntu', 'debian']);
    expect(blockVisible(ufw!, 'ubuntu')).toBe(true);
    expect(blockVisible(ufw!, 'debian')).toBe(true);
    expect(blockVisible(ufw!, 'rhel')).toBe(false);
  });

  it('shows shared blocks on all distros', () => {
    const thp = step.blocks.find((b) => b.contentKey === 'steps.os-prep.blocks.thp-check');
    expect(thp?.distros).toBeUndefined();
    for (const d of ['rhel', 'ubuntu', 'debian'] as const) {
      expect(blockVisible(thp!, d)).toBe(true);
    }
  });
});

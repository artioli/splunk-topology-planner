import { describe, expect, it } from 'vitest';
import { osPrepSteps } from '../steps/osPrep';
import type { DeploymentProfileId, GuideBlock, LinuxDistro } from '../types';

function blockVisible(
  block: GuideBlock,
  distro: LinuxDistro,
  profileId: DeploymentProfileId = 'distributed_ic',
): boolean {
  if (block.distros?.length && !block.distros.includes(distro)) return false;
  if (block.profiles?.length && !block.profiles.includes(profileId)) return false;
  return true;
}

describe('guideDistro', () => {
  const step = osPrepSteps[0];

  it('includes RHEL firewalld blocks for rhel only', () => {
    const firewalld = step.blocks.find(
      (b) =>
        b.contentKey === 'steps.os-prep.blocks.firewalld-ports' &&
        b.distros?.includes('rhel') &&
        b.profiles?.includes('distributed_ic'),
    );
    expect(firewalld?.distros).toEqual(['rhel']);
    expect(blockVisible(firewalld!, 'rhel', 'distributed_ic')).toBe(true);
    expect(blockVisible(firewalld!, 'ubuntu', 'distributed_ic')).toBe(false);
  });

  it('includes ufw blocks for ubuntu and debian', () => {
    const ufw = step.blocks.find(
      (b) =>
        b.contentKey === 'steps.os-prep.blocks.ufw-ports' &&
        b.distros?.includes('ubuntu') &&
        b.profiles?.includes('distributed_ic'),
    );
    expect(ufw?.distros).toEqual(['ubuntu', 'debian']);
    expect(blockVisible(ufw!, 'ubuntu', 'distributed_ic')).toBe(true);
    expect(blockVisible(ufw!, 'debian', 'distributed_ic')).toBe(true);
    expect(blockVisible(ufw!, 'rhel', 'distributed_ic')).toBe(false);
  });

  it('shows shared blocks on all distros', () => {
    const thp = step.blocks.find((b) => b.contentKey === 'steps.os-prep.blocks.thp-check');
    expect(thp?.distros).toBeUndefined();
    for (const d of ['rhel', 'ubuntu', 'debian'] as const) {
      expect(blockVisible(thp!, d)).toBe(true);
    }
  });

  it('single profile firewall blocks omit cluster ports', () => {
    const singleFw = step.blocks.find(
      (b) => b.contentKey === 'steps.os-prep.blocks.firewalld-ports' && b.profiles?.includes('single'),
    );
    expect(singleFw?.commands?.join(' ')).not.toContain('9887');
    expect(singleFw?.commands?.join(' ')).not.toContain('8080');
    const distFw = step.blocks.find(
      (b) =>
        b.contentKey === 'steps.os-prep.blocks.firewalld-ports' &&
        b.profiles?.includes('distributed_ic'),
    );
    expect(distFw?.commands?.join(' ')).toContain('9887');
  });
});

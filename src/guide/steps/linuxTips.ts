import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const linuxTipsSteps: GuideStep[] = [
  {
    id: 'linux-tips',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['all-splunk'],
    docLinks: [{ labelKey: 'guide.docs.systemRequirements', url: GUIDE_DOC_LINKS.systemRequirements }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.linux-tips.blocks.intro',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
      },
      {
        type: 'text',
        contentKey: 'steps.linux-tips.blocks.intro-single',
        profiles: ['single'],
      },
      {
        type: 'text',
        contentKey: 'steps.linux-tips.blocks.vi-basics',
      },
      {
        type: 'commands',
        contentKey: 'steps.linux-tips.blocks.disk-check',
        commands: ['df -h', 'lsblk', 'free -h', 'nproc', 'whoami'],
      },
      {
        type: 'commands',
        contentKey: 'steps.linux-tips.blocks.ssh-admin',
        commands: ['ssh {{OS_USER}}@{{MGMT_IP}}', 'sudo -i', 'id {{OS_USER}}'],
      },
      {
        type: 'warning',
        contentKey: 'steps.linux-tips.blocks.firewall-lab',
      },
    ],
    validations: [
      {
        id: 'disk',
        labelKey: 'steps.linux-tips.validations.disk.label',
        command: 'df -h',
        expectKey: 'steps.linux-tips.validations.disk.expect',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
      },
      {
        id: 'disk',
        labelKey: 'steps.linux-tips.validations.disk.label',
        command: 'df -h',
        expectKey: 'steps.linux-tips.validations.disk.expect-single',
        profiles: ['single'],
      },
      {
        id: 'whoami',
        labelKey: 'steps.linux-tips.validations.whoami.label',
        command: 'whoami',
        expectKey: 'steps.linux-tips.validations.whoami.expect',
      },
    ],
  },
];

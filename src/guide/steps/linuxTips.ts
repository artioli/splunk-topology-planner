import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const linuxTipsSteps: GuideStep[] = [
  {
    id: 'linux-tips',
    phase: 'STEP 0',
    title: 'Linux quick tips',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['all-splunk'],
    docLinks: [{ label: 'System requirements (Linux)', url: GUIDE_DOC_LINKS.systemRequirements }],
    blocks: [
      {
        type: 'text',
        content:
          'Run commands in order. Comments start with #. When a step says multi-exec, run the same commands on every listed host (MobaXterm multi-exec, parallel SSH, or repeat manually).',
      },
      {
        type: 'text',
        content:
          '**vi basics:** `i` = insert, `Esc` = command mode, `:wq` = save and quit, `:q!` = quit without saving. `nano` is acceptable if you prefer.',
      },
      {
        type: 'commands',
        content: 'Check disk space before installing Splunk (need separate OS and data volumes on indexers):',
        commands: ['df -h', 'lsblk', 'free -h', 'nproc', 'whoami'],
      },
      {
        type: 'commands',
        content: 'SSH to a host as your admin user, then switch to the Splunk OS user when needed:',
        commands: [
          'ssh {{OS_USER}}@{{MGMT_IP}}',
          'sudo -i',
          'id {{OS_USER}}',
        ],
      },
      {
        type: 'warning',
        content:
          'Lab shortcut: some training environments disable firewalld entirely. In production, open only required TCP ports (8000, 8089, 9997, 8088, cluster ports) instead of disabling the firewall.',
      },
    ],
  },
];

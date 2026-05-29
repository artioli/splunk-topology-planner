import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const osPrepSteps: GuideStep[] = [
  {
    id: 'os-prep',
    phase: 'STEP 1',
    title: 'OS prerequisites (all Splunk Enterprise hosts)',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['all-splunk'],
    docLinks: [
      { label: 'Reference hardware', url: GUIDE_DOC_LINKS.referenceHardware },
      { label: 'Capacity planning', url: GUIDE_DOC_LINKS.capacityManual },
    ],
    blocks: [
      {
        type: 'text',
        content:
          'Create OS user **{{OS_USER}}** on every Splunk host. Splunk should not run as root. Use dedicated data volumes for indexers.',
      },
      {
        type: 'commands',
        content: 'Create splunkuser (run as root on each host):',
        commands: [
          'sudo useradd -m -s /bin/bash {{OS_USER}}',
          'sudo passwd {{OS_USER}}',
        ],
      },
      {
        type: 'commands',
        content: 'RHEL — check and set ulimits for {{OS_USER}} in /etc/security/limits.conf:',
        commands: [
          'ulimit -Sa',
          'ulimit -Ha',
          'sudo vi /etc/security/limits.conf',
          '# Append:',
          '{{OS_USER}}  soft  nofile  10240',
          '{{OS_USER}}  hard  nofile  64000',
          '{{OS_USER}}  soft  nproc   16000',
          '{{OS_USER}}  soft  fsize   unlimited',
        ],
      },
      {
        type: 'ubuntu',
        content:
          'Ubuntu/Debian: use the same limits in `/etc/security/limits.conf`. Package names differ (`apt` vs `yum`); THP path is the same under `/sys/kernel/mm/transparent_hugepage/enabled`.',
      },
      {
        type: 'commands',
        content: 'Disable Transparent Huge Pages (THP) — required for Splunk on Linux:',
        commands: [
          'cat /sys/kernel/mm/transparent_hugepage/enabled',
          'sudo vi /etc/default/grub',
          '# Add to GRUB_CMDLINE_LINUX: transparent_hugepage=never',
          'sudo grub2-mkconfig -o /boot/grub2/grub.cfg',
          'sudo reboot',
        ],
      },
      {
        type: 'commands',
        content: 'RHEL — open required ports with firewalld (preferred over disabling):',
        commands: [
          'sudo firewall-cmd --permanent --add-port=8000/tcp',
          'sudo firewall-cmd --permanent --add-port=8089/tcp',
          'sudo firewall-cmd --permanent --add-port=9997/tcp',
          'sudo firewall-cmd --permanent --add-port=8088/tcp',
          'sudo firewall-cmd --permanent --add-port=8080/tcp',
          'sudo firewall-cmd --permanent --add-port=9887/tcp',
          'sudo firewall-cmd --reload',
        ],
      },
      {
        type: 'warning',
        content:
          'Lab only: `sudo systemctl stop firewalld && sudo systemctl disable firewalld` — do not use in production.',
      },
    ],
  },
];

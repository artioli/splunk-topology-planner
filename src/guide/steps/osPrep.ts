import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const osPrepSteps: GuideStep[] = [
  {
    id: 'os-prep',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['all-splunk'],
    docLinks: [
      { labelKey: 'guide.docs.referenceHardware', url: GUIDE_DOC_LINKS.referenceHardware },
      { labelKey: 'guide.docs.capacityManual', url: GUIDE_DOC_LINKS.capacityManual },
    ],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.os-prep.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.create-user',
        commands: ['sudo useradd -m -s /bin/bash {{OS_USER}}', 'sudo passwd {{OS_USER}}'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.ulimits-check',
        distros: ['rhel'],
        commands: ['ulimit -Sa', 'ulimit -Ha'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.limits-open',
        commands: ['sudo vi /etc/security/limits.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.limits-append',
        copyAsBlock: true,
        commands: [
          '{{OS_USER}}  soft  nofile  10240',
          '{{OS_USER}}  hard  nofile  64000',
          '{{OS_USER}}  soft  nproc   16000',
          '{{OS_USER}}  soft  fsize   unlimited',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.os-prep.blocks.selinux',
        distros: ['rhel'],
      },
      {
        type: 'text',
        contentKey: 'steps.os-prep.blocks.ubuntu-note',
        distros: ['ubuntu', 'debian'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.thp-check',
        commands: ['cat /sys/kernel/mm/transparent_hugepage/enabled'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.grub-edit',
        commands: ['sudo vi /etc/default/grub'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.grub-apply',
        distros: ['rhel'],
        commands: ['sudo grub2-mkconfig -o /boot/grub2/grub.cfg', 'sudo reboot'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.grub-apply',
        distros: ['ubuntu', 'debian'],
        commands: ['sudo update-grub', 'sudo reboot'],
      },
      {
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.firewalld-ports',
        distros: ['rhel'],
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
        type: 'commands',
        contentKey: 'steps.os-prep.blocks.ufw-ports',
        distros: ['ubuntu', 'debian'],
        commands: [
          'sudo ufw allow 8000/tcp',
          'sudo ufw allow 8089/tcp',
          'sudo ufw allow 9997/tcp',
          'sudo ufw allow 8088/tcp',
          'sudo ufw allow 8080/tcp',
          'sudo ufw allow 9887/tcp',
          'sudo ufw enable',
        ],
      },
      {
        type: 'warning',
        contentKey: 'steps.os-prep.blocks.firewall-lab',
        distros: ['rhel'],
      },
      {
        type: 'warning',
        contentKey: 'steps.os-prep.blocks.firewall-lab-debian',
        distros: ['ubuntu', 'debian'],
      },
    ],
    validations: [
      {
        id: 'limits',
        labelKey: 'steps.os-prep.validations.limits.label',
        command: 'ulimit -Sa',
        expectKey: 'steps.os-prep.validations.limits.expect',
      },
      {
        id: 'thp',
        labelKey: 'steps.os-prep.validations.thp.label',
        command: 'cat /sys/kernel/mm/transparent_hugepage/enabled',
        expectKey: 'steps.os-prep.validations.thp.expect',
      },
      {
        id: 'firewall',
        labelKey: 'steps.os-prep.validations.firewall.label',
        expectKey: 'steps.os-prep.validations.firewall.expect',
        optional: true,
      },
    ],
  },
];

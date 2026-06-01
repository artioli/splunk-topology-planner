import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const installSteps: GuideStep[] = [
  {
    id: 'install-splunk',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['all-splunk'],
    docLinks: [
      { labelKey: 'guide.docs.installLinux', url: GUIDE_DOC_LINKS.installLinux },
      { labelKey: 'guide.docs.download', url: GUIDE_DOC_LINKS.download },
    ],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.install-splunk.blocks.download-intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.install-splunk.blocks.download-extract',
        commands: [
          'cd /home/{{OS_USER}}',
          '# Get URL from https://www.splunk.com/en_us/download/splunk-enterprise.html',
          'wget -O {{SPLUNK_TGZ}} "https://download.splunk.com/products/splunk/releases/{{SPLUNK_VERSION}}/linux/{{SPLUNK_TGZ}}"',
          'sudo mkdir -p /opt/splunk',
          'sudo chown {{OS_USER}}:{{OS_USER}} /opt/splunk',
          'tar -xzf {{SPLUNK_TGZ}} -C /opt',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.install-splunk.blocks.first-start',
        commands: [
          '/opt/splunk/bin/splunk start --accept-license',
          '# OS user: {{OS_USER}}',
          '# Splunk admin password: {{ADMIN_PASSWORD}}',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.install-splunk.blocks.boot-start',
        commands: [
          'sudo /opt/splunk/bin/splunk enable boot-start -user {{OS_USER}} -systemd-managed 1',
          'sudo systemctl status Splunkd',
          '/opt/splunk/bin/splunk status',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.install-splunk.blocks.ubuntu-boot',
        distros: ['ubuntu', 'debian'],
      },
    ],
    validations: [
      {
        id: 'status',
        labelKey: 'steps.install-splunk.validations.status.label',
        command: '/opt/splunk/bin/splunk status',
        expectKey: 'steps.install-splunk.validations.status.expect',
      },
      {
        id: 'systemd',
        labelKey: 'steps.install-splunk.validations.systemd.label',
        command: 'systemctl status Splunkd',
        expectKey: 'steps.install-splunk.validations.systemd.expect',
      },
    ],
  },
];

import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const installSteps: GuideStep[] = [
  {
    id: 'install-splunk',
    phase: 'STEP 2',
    title: 'Download and install Splunk Enterprise',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['all-splunk'],
    docLinks: [
      { label: 'Install on Linux (tgz)', url: GUIDE_DOC_LINKS.installLinux },
      { label: 'Download Splunk Enterprise', url: GUIDE_DOC_LINKS.download },
    ],
    blocks: [
      {
        type: 'text',
        content:
          'Use the latest GA **.tgz** package from Splunk downloads. Multi-exec these steps on every Splunk Enterprise host in your profile (not forwarders).',
      },
      {
        type: 'commands',
        content: 'Download and extract (example — replace URL with your version from splunk.com):',
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
        content: 'First start and license acceptance:',
        commands: [
          '/opt/splunk/bin/splunk start --accept-license',
          '# OS user: {{OS_USER}}',
          '# Splunk admin password: {{ADMIN_PASSWORD}}',
        ],
      },
      {
        type: 'commands',
        content: 'Enable boot-start (systemd on RHEL 8+):',
        commands: [
          'sudo /opt/splunk/bin/splunk enable boot-start -user {{OS_USER}} -systemd-managed 1',
          'sudo systemctl status Splunkd',
          '/opt/splunk/bin/splunk status',
        ],
      },
      {
        type: 'ubuntu',
        content:
          'Ubuntu: `splunk enable boot-start` creates systemd unit on modern releases. Verify with `systemctl status Splunkd`.',
      },
    ],
  },
];

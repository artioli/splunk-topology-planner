import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

const ALL_PROFILES = ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'] as const;

export const licenseSteps: GuideStep[] = [
  {
    id: 'license-manager',
    phase: 'STEP 3',
    title: 'Configure License Manager',
    profiles: [...ALL_PROFILES],
    targets: ['mgmt', 'combined'],
    docLinks: [{ label: 'Configure a license manager', url: GUIDE_DOC_LINKS.licenseManager }],
    blocks: [
      {
        type: 'text',
        content:
          'On the management host (or combined server for single-server). Never store production license files in public repos.',
      },
      {
        type: 'commands',
        content: 'Add license and set server name:',
        commands: [
          'ssh {{OS_USER}}@{{MGMT_IP}}',
          '/opt/splunk/bin/splunk status',
          'sudo mkdir -p /opt/license && sudo chown {{OS_USER}}:{{OS_USER}} /opt/license',
          '# Copy your .license file to {{LICENSE_PATH}}',
          '/opt/splunk/bin/splunk add licenses {{LICENSE_PATH}}',
          '/opt/splunk/bin/splunk set servername {{MGMT_HOST}}-lm',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content:
          'Via Splunk Web: **Settings → Server settings → General settings** — enable HTTPS. **Settings → Licensing** — verify license.',
      },
      {
        type: 'text',
        content:
          '**Settings → Monitoring Console → Settings → General Setup → Edit Server Roles** — enable License Manager and Deployment Server (when DS is colocated).',
      },
    ],
  },
  {
    id: 'license-slaves',
    phase: 'STEP 3b',
    title: 'Register license slaves',
    profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['idx-all', 'sh-all', 'cm', 'deployer', 'ds'],
    docLinks: [{ label: 'License manager', url: GUIDE_DOC_LINKS.licenseManager }],
    blocks: [
      {
        type: 'commands',
        content: 'On every non-LM Splunk instance:',
        commands: [
          '/opt/splunk/bin/splunk edit licenser-localslave -master_uri https://{{LM_IP}}:8089',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        content: 'Verify on License Manager:',
        commands: ['/opt/splunk/bin/splunk list licenser-slaves'],
      },
    ],
  },
  {
    id: 'license-slave-single',
    phase: 'STEP 3b',
    title: 'License on single server',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ label: 'License manager', url: GUIDE_DOC_LINKS.licenseManager }],
    blocks: [
      {
        type: 'text',
        content: 'Single-server: license is local on the combined instance. Skip slave registration.',
      },
    ],
  },
];

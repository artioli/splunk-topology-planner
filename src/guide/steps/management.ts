import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const managementSteps: GuideStep[] = [
  {
    id: 'monitoring-console',
    phase: 'STEP 8',
    title: 'Configure Monitoring Console (distributed)',
    profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt'],
    docLinks: [{ label: 'Monitoring Console host', url: GUIDE_DOC_LINKS.monitoringConsole }],
    blocks: [
      {
        type: 'commands',
        content: 'On management host — add distributed instances:',
        commands: [
          '/opt/splunk/bin/splunk add search-server https://{{IDX1_IP}}:8089 -remoteUsername admin -remotePassword {{ADMIN_PASSWORD}}',
          '# Repeat for each indexer, SH, CM, DS as applicable',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content:
          '**Settings → Monitoring Console → General Setup** — change mode from Standalone to **Distributed**. Assign server roles on each remote instance.',
      },
    ],
  },
  {
    id: 'monitoring-console-single',
    phase: 'STEP 8',
    title: 'Monitoring Console (single server)',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ label: 'Monitoring Console', url: GUIDE_DOC_LINKS.monitoringConsole }],
    blocks: [
      {
        type: 'text',
        content: 'Single server: MC runs in standalone mode on the combined instance.',
      },
    ],
  },
];

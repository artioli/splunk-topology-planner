import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const distributedNcSteps: GuideStep[] = [
  {
    id: 'nc-indexer',
    phase: 'STEP 4',
    title: 'Configure standalone indexer',
    profiles: ['distributed_nc'],
    targets: ['idx1'],
    docLinks: [{ label: 'Distributed deployment', url: GUIDE_DOC_LINKS.managementComponents }],
    blocks: [
      {
        type: 'commands',
        content: 'On indexer {{IDX1_HOST}} ({{IDX1_IP}}):',
        commands: [
          '/opt/splunk/bin/splunk set servername {{IDX1_HOST}}',
          '/opt/splunk/bin/splunk enable listen 9997',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content: 'MC role: Settings → Monitoring Console → Edit Server Roles → Indexer.',
      },
    ],
  },
  {
    id: 'nc-search-head',
    phase: 'STEP 5',
    title: 'Configure search head',
    profiles: ['distributed_nc'],
    targets: ['sh1'],
    docLinks: [{ label: 'Distributed search', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        content: 'On search head {{SH1_HOST}}:',
        commands: [
          '/opt/splunk/bin/splunk set servername {{SH1_HOST}}',
          '/opt/splunk/bin/splunk add search-server https://{{IDX1_IP}}:8089 -remoteUsername admin -remotePassword {{ADMIN_PASSWORD}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content: 'Enable HTTPS on Splunk Web. MC role: Search Head.',
      },
    ],
  },
];

export const singleServerSteps: GuideStep[] = [
  {
    id: 'single-roles',
    phase: 'STEP 4',
    title: 'Configure combined instance roles',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ label: 'SVA single server', url: GUIDE_DOC_LINKS.sva }],
    blocks: [
      {
        type: 'commands',
        content: 'On combined server:',
        commands: [
          '/opt/splunk/bin/splunk set servername {{MGMT_HOST}}-single',
          '/opt/splunk/bin/splunk enable listen 9997',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content:
          'MC roles: License Manager, Deployment Server, Monitoring Console, Indexer, Search Head (all on one instance for lab).',
      },
    ],
  },
];

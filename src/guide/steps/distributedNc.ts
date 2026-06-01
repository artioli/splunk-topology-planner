import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const distributedNcSteps: GuideStep[] = [
  {
    id: 'nc-indexer',
    profiles: ['distributed_nc'],
    targets: ['idx1'],
    docLinks: [{ labelKey: 'guide.docs.managementComponents', url: GUIDE_DOC_LINKS.managementComponents }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.nc-indexer.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{IDX1_HOST}}',
          '/opt/splunk/bin/splunk enable listen 9997',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.nc-indexer.blocks.mc-role',
      },
    ],
    validations: [
      {
        id: 'listen',
        labelKey: 'steps.nc-indexer.validations.listen.label',
        command: '/opt/splunk/bin/splunk show listen',
        expectKey: 'steps.nc-indexer.validations.listen.expect',
      },
    ],
  },
  {
    id: 'nc-search-head',
    profiles: ['distributed_nc'],
    targets: ['sh1'],
    docLinks: [{ labelKey: 'guide.docs.indexerCluster', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.nc-search-head.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{SH1_HOST}}',
          '/opt/splunk/bin/splunk add search-server https://{{IDX1_IP}}:8089 -remoteUsername admin -remotePassword {{ADMIN_PASSWORD}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.nc-search-head.blocks.https-mc',
      },
    ],
    validations: [
      {
        id: 'search-server',
        labelKey: 'steps.nc-search-head.validations.search-server.label',
        expectKey: 'steps.nc-search-head.validations.search-server.expect',
      },
    ],
  },
];

export const singleServerSteps: GuideStep[] = [
  {
    id: 'single-roles',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ labelKey: 'guide.docs.sva', url: GUIDE_DOC_LINKS.sva }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.single-roles.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{MGMT_HOST}}-single',
          '/opt/splunk/bin/splunk enable listen 9997',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.single-roles.blocks.mc-roles',
      },
    ],
    validations: [
      {
        id: 'listen',
        labelKey: 'steps.single-roles.validations.listen.label',
        command: '/opt/splunk/bin/splunk show listen',
        expectKey: 'steps.single-roles.validations.listen.expect',
      },
    ],
  },
];

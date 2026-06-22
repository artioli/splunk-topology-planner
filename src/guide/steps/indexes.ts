import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const indexSteps: GuideStep[] = [
  {
    id: 'indexes-cluster',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['cm'],
    docLinks: [{ labelKey: 'guide.docs.indexerCluster', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.indexes-cluster.blocks.mkdir',
        commands: ['mkdir -p /opt/splunk/etc/master-apps/_cluster/local'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-cluster.blocks.open-indexes',
        commands: ['vi /opt/splunk/etc/master-apps/_cluster/local/indexes.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-cluster.blocks.paste-index',
        copyAsBlock: true,
        commands: [
          '[os]',
          'repFactor = auto',
          'homePath = $SPLUNK_DB/$_index_name/db',
          'coldPath = $SPLUNK_DB/$_index_name/colddb',
          'thawedPath = $SPLUNK_DB/$_index_name/thaweddb',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-cluster.blocks.apply-bundle',
        commands: [
          '/opt/splunk/bin/splunk apply cluster-bundle',
          '/opt/splunk/bin/splunk show cluster-bundle-status',
        ],
      },
    ],
    validations: [
      {
        id: 'bundle',
        labelKey: 'steps.indexes-cluster.validations.bundle.label',
        command: '/opt/splunk/bin/splunk show cluster-bundle-status',
        expectKey: 'steps.indexes-cluster.validations.bundle.expect',
      },
    ],
  },
  {
    id: 'indexes-standalone',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ labelKey: 'guide.docs.capacityManual', url: GUIDE_DOC_LINKS.capacityManual }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.indexes-standalone.blocks.open-indexes',
        commands: ['vi /opt/splunk/etc/system/local/indexes.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-standalone.blocks.paste-index',
        copyAsBlock: true,
        commands: [
          '[os]',
          'homePath = $SPLUNK_DB/os/db',
          'coldPath = $SPLUNK_DB/os/colddb',
          'thawedPath = $SPLUNK_DB/os/thaweddb',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-standalone.blocks.restart',
        commands: ['/opt/splunk/bin/splunk restart'],
      },
    ],
    validations: [
      {
        id: 'index',
        labelKey: 'steps.indexes-standalone.validations.index.label',
        expectKey: 'steps.indexes-standalone.validations.index.expect',
      },
    ],
  },
  {
    id: 'indexes-standalone-nc',
    profiles: ['distributed_nc'],
    targets: ['idx1'],
    docLinks: [{ labelKey: 'guide.docs.capacityManual', url: GUIDE_DOC_LINKS.capacityManual }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.indexes-standalone.blocks.open-indexes',
        commands: ['vi /opt/splunk/etc/system/local/indexes.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-standalone.blocks.paste-index',
        copyAsBlock: true,
        commands: [
          '[os]',
          'homePath = $SPLUNK_DB/os/db',
          'coldPath = $SPLUNK_DB/os/colddb',
          'thawedPath = $SPLUNK_DB/os/thaweddb',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexes-standalone.blocks.restart',
        commands: ['/opt/splunk/bin/splunk restart'],
      },
    ],
    validations: [
      {
        id: 'index',
        labelKey: 'steps.indexes-standalone.validations.index.label',
        expectKey: 'steps.indexes-standalone.validations.index.expect',
      },
    ],
  },
];

import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const indexSteps: GuideStep[] = [
  {
    id: 'indexes-cluster',
    phase: 'STEP 9',
    title: 'Create indexes (indexer cluster)',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['cm'],
    docLinks: [{ label: 'Indexer cluster indexes', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        content: 'On Cluster Manager — cluster bundle app:',
        commands: [
          'mkdir -p /opt/splunk/etc/master-apps/_cluster/local',
          'vi /opt/splunk/etc/master-apps/_cluster/local/indexes.conf',
          '[os]',
          'repFactor = auto',
          'homePath = $SPLUNK_DB/$_index_name/db',
          'coldPath = $SPLUNK_DB/$_index_name/colddb',
          'thawedPath = $SPLUNK_DB/$_index_name/thaweddb',
          '',
          '/opt/splunk/bin/splunk apply cluster-bundle',
          '/opt/splunk/bin/splunk show cluster-bundle-status',
        ],
      },
    ],
  },
  {
    id: 'indexes-standalone',
    phase: 'STEP 9',
    title: 'Create indexes (standalone / non-cluster)',
    profiles: ['single', 'distributed_nc'],
    targets: ['combined', 'idx1'],
    docLinks: [{ label: 'Indexes.conf', url: GUIDE_DOC_LINKS.capacityManual }],
    blocks: [
      {
        type: 'commands',
        content: 'On indexer (or combined server):',
        commands: [
          'vi /opt/splunk/etc/system/local/indexes.conf',
          '[os]',
          'homePath = $SPLUNK_DB/os/db',
          'coldPath = $SPLUNK_DB/os/colddb',
          'thawedPath = $SPLUNK_DB/os/thaweddb',
          '/opt/splunk/bin/splunk restart',
        ],
      },
    ],
  },
];

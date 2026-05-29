import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const indexerClusterSteps: GuideStep[] = [
  {
    id: 'ic-manager',
    phase: 'STEP 4',
    title: 'Configure Cluster Manager',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['cm'],
    docLinks: [
      { label: 'Configure the manager node', url: GUIDE_DOC_LINKS.clusterManager },
      { label: 'Deploy indexer cluster', url: GUIDE_DOC_LINKS.indexerCluster },
    ],
    blocks: [
      {
        type: 'text',
        content:
          'Splunk 9.x+ uses **Cluster Manager** (`-mode manager`). Legacy docs may say "cluster master".',
      },
      {
        type: 'commands',
        content: 'On Cluster Manager {{CM_HOST}} ({{CM_IP}}):',
        commands: [
          '/opt/splunk/bin/splunk set servername {{CM_HOST}}',
          '/opt/splunk/bin/splunk edit cluster-config -mode manager -replication_factor 3 -search_factor 2 -secret {{CLUSTER_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content: 'MC role: Cluster Manager. Enable HTTPS. Never colocate CM with Deployment Server.',
      },
    ],
  },
  {
    id: 'ic-peers',
    phase: 'STEP 5',
    title: 'Configure indexer cluster peers',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['idx-all'],
    docLinks: [{ label: 'Indexer cluster peers', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        content: 'Multi-exec on all indexers ({{IDX1_IP}}, {{IDX2_IP}}, {{IDX3_IP}}):',
        commands: [
          '/opt/splunk/bin/splunk set servername <HOSTNAME>-idxN',
          '/opt/splunk/bin/splunk enable listen 9997',
          '/opt/splunk/bin/splunk disable webserver',
          '/opt/splunk/bin/splunk edit cluster-config -mode peer -manager_uri https://{{CM_IP}}:8089 -secret {{CLUSTER_SECRET}} -replication_port 9887',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        content: 'Verify on Cluster Manager:',
        commands: ['/opt/splunk/bin/splunk show cluster-status'],
      },
    ],
  },
  {
    id: 'ic-searchhead',
    phase: 'STEP 6',
    title: 'Configure search head for indexer cluster',
    profiles: ['distributed_ic'],
    targets: ['sh1'],
    docLinks: [{ label: 'Indexer cluster search head', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        content: 'On search head {{SH1_HOST}}:',
        commands: [
          '/opt/splunk/bin/splunk set servername {{SH1_HOST}}',
          '/opt/splunk/bin/splunk edit cluster-config -mode searchhead -manager_uri https://{{CM_IP}}:8089 -secret {{CLUSTER_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
    ],
  },
  {
    id: 'disable-indexing-non-indexers',
    phase: 'STEP 7',
    title: 'Disable local indexing on non-indexer roles',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt', 'cm', 'sh-all', 'deployer', 'ds'],
    docLinks: [{ label: 'Forward internal data', url: GUIDE_DOC_LINKS.capacityManual }],
    blocks: [
      {
        type: 'commands',
        content: 'Create /opt/splunk/etc/system/local/outputs.conf on CM, SH, mgmt, deployer, DS:',
        commands: [
          'vi /opt/splunk/etc/system/local/outputs.conf',
          '[indexAndForward]',
          'index = false',
          '',
          '[tcpout]',
          'defaultGroup = default-autolb-group',
          'forwardedindex.filter.disable = true',
          'indexAndForward = false',
          '',
          '[tcpout:default-autolb-group]',
          'server={{IDX_RECEIVING_LIST}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
    ],
  },
];

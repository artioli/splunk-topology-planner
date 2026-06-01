import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const indexerClusterSteps: GuideStep[] = [
  {
    id: 'ic-manager',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['cm'],
    docLinks: [
      { labelKey: 'guide.docs.clusterManager', url: GUIDE_DOC_LINKS.clusterManager },
      { labelKey: 'guide.docs.indexerCluster', url: GUIDE_DOC_LINKS.indexerCluster },
    ],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.ic-manager.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.ic-manager.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{CM_HOST}}',
          '/opt/splunk/bin/splunk edit cluster-config -mode manager -replication_factor {{RF}} -search_factor {{SF}} -secret {{CLUSTER_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.ic-manager.blocks.mc-roles',
      },
      {
        type: 'text',
        contentKey: 'steps.ic-manager.blocks.handoff-rf-sf',
      },
    ],
    validations: [
      {
        id: 'cluster-config',
        labelKey: 'steps.ic-manager.validations.cluster-config.label',
        command: '/opt/splunk/bin/splunk show cluster-status',
        expectKey: 'steps.ic-manager.validations.cluster-config.expect',
      },
    ],
  },
  {
    id: 'ic-peers',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['idx-all'],
    docLinks: [{ labelKey: 'guide.docs.indexerCluster', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.ic-peers.blocks.configure',
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
        contentKey: 'steps.ic-peers.blocks.verify',
        commands: ['/opt/splunk/bin/splunk show cluster-status'],
      },
    ],
    validations: [
      {
        id: 'peers',
        labelKey: 'steps.ic-peers.validations.peers.label',
        command: '/opt/splunk/bin/splunk show cluster-status',
        expectKey: 'steps.ic-peers.validations.peers.expect',
      },
    ],
  },
  {
    id: 'ic-searchhead',
    profiles: ['distributed_ic'],
    targets: ['sh1'],
    docLinks: [{ labelKey: 'guide.docs.indexerCluster', url: GUIDE_DOC_LINKS.indexerCluster }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.ic-searchhead.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{SH1_HOST}}',
          '/opt/splunk/bin/splunk edit cluster-config -mode searchhead -manager_uri https://{{CM_IP}}:8089 -secret {{CLUSTER_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
    ],
    validations: [
      {
        id: 'sh-cluster',
        labelKey: 'steps.ic-searchhead.validations.sh-cluster.label',
        expectKey: 'steps.ic-searchhead.validations.sh-cluster.expect',
      },
    ],
  },
  {
    id: 'disable-indexing-non-indexers',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt', 'cm', 'sh-all', 'deployer', 'ds'],
    docLinks: [{ labelKey: 'guide.docs.capacityManual', url: GUIDE_DOC_LINKS.capacityManual }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.disable-indexing-non-indexers.blocks.create-outputs',
        commands: ['vi /opt/splunk/etc/system/local/outputs.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.disable-indexing-non-indexers.blocks.indexAndForward',
        copyAsBlock: true,
        commands: ['[indexAndForward]', 'index = false'],
      },
      {
        type: 'commands',
        contentKey: 'steps.disable-indexing-non-indexers.blocks.tcpout',
        copyAsBlock: true,
        commands: [
          '[tcpout]',
          'defaultGroup = default-autolb-group',
          'forwardedindex.filter.disable = true',
          'indexAndForward = false',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.disable-indexing-non-indexers.blocks.tcpout-group',
        copyAsBlock: true,
        commands: ['[tcpout:default-autolb-group]', 'server={{IDX_RECEIVING_LIST}}'],
      },
      {
        type: 'commands',
        contentKey: 'steps.disable-indexing-non-indexers.blocks.restart',
        commands: ['/opt/splunk/bin/splunk restart'],
      },
    ],
    validations: [
      {
        id: 'outputs',
        labelKey: 'steps.disable-indexing-non-indexers.validations.outputs.label',
        expectKey: 'steps.disable-indexing-non-indexers.validations.outputs.expect',
      },
    ],
  },
];

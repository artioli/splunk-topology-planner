import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const forwarderAppendixSteps: GuideStep[] = [
  {
    id: 'uf-install',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['uf-all'],
    optional: true,
    docLinks: [{ labelKey: 'guide.docs.forwarders', url: GUIDE_DOC_LINKS.forwarders }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.uf-install.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.uf-install.blocks.install',
        commands: [
          'wget -O splunkforwarder-{{SPLUNK_VERSION}}-linux-amd64.tgz "https://download.splunk.com/products/universalforwarder/releases/{{SPLUNK_VERSION}}/linux/splunkforwarder-{{SPLUNK_VERSION}}-linux-amd64.tgz"',
          'sudo mkdir -p /opt/splunkforwarder && sudo chown {{OS_USER}}:{{OS_USER}} /opt/splunkforwarder',
          'tar -xzf splunkforwarder-*.tgz -C /opt',
          '/opt/splunkforwarder/bin/splunk start --accept-license',
          'sudo /opt/splunkforwarder/bin/splunk enable boot-start -user {{OS_USER}} -systemd-managed 1',
        ],
      },
    ],
    validations: [
      {
        id: 'uf',
        labelKey: 'steps.uf-install.validations.uf.label',
        command: '/opt/splunkforwarder/bin/splunk status',
        expectKey: 'steps.uf-install.validations.uf.expect',
      },
    ],
  },
  {
    id: 'uf-ds-poll',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['uf-all'],
    optional: true,
    docLinks: [{ labelKey: 'guide.docs.deploymentServer', url: GUIDE_DOC_LINKS.deploymentServer }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.uf-ds-poll.blocks.configure',
        profiles: ['single', 'distributed_nc'],
        commands: [
          '/opt/splunkforwarder/bin/splunk set deploy-poll {{MGMT_IP}}:8089',
          '/opt/splunkforwarder/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.uf-ds-poll.blocks.configure',
        profiles: ['distributed_ic', 'distributed_ic_shc'],
        commands: [
          '/opt/splunkforwarder/bin/splunk set deploy-poll {{DS_IP}}:8089',
          '/opt/splunkforwarder/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.uf-ds-poll.blocks.server-class',
      },
    ],
    validations: [
      {
        id: 'poll',
        labelKey: 'steps.uf-ds-poll.validations.poll.label',
        expectKey: 'steps.uf-ds-poll.validations.poll.expect',
      },
    ],
  },
  {
    id: 'indexer-discovery',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['cm', 'ds'],
    optional: true,
    docLinks: [{ labelKey: 'guide.docs.deploymentServer', url: GUIDE_DOC_LINKS.deploymentServer }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.indexer-discovery.blocks.open-server-conf',
        commands: ['vi /opt/splunk/etc/system/local/server.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexer-discovery.blocks.paste-discovery',
        copyAsBlock: true,
        commands: ['[indexer_discovery]', 'pass4SymmKey = {{CLUSTER_FWD_SECRET}}'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexer-discovery.blocks.restart',
        commands: ['/opt/splunk/bin/splunk restart'],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexer-discovery.blocks.tcpout-stanza',
        copyAsBlock: true,
        commands: [
          '[tcpout:default-autolb-group]',
          'indexerDiscovery = idxc1',
          'useACK = true',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.indexer-discovery.blocks.idxc-stanza',
        copyAsBlock: true,
        commands: [
          '[indexer_discovery:idxc1]',
          'master_uri = https://{{CM_IP}}:8089',
          'pass4SymmKey = {{CLUSTER_FWD_SECRET}}',
        ],
      },
    ],
    validations: [
      {
        id: 'discovery',
        labelKey: 'steps.indexer-discovery.validations.discovery.label',
        expectKey: 'steps.indexer-discovery.validations.discovery.expect',
      },
    ],
  },
];

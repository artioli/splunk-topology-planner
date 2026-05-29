import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const forwarderAppendixSteps: GuideStep[] = [
  {
    id: 'uf-install',
    phase: 'APPENDIX A',
    title: 'Install Universal Forwarder',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['uf-all'],
    optional: true,
    docLinks: [{ label: 'Install Universal Forwarder', url: GUIDE_DOC_LINKS.forwarders }],
    blocks: [
      {
        type: 'text',
        content: 'Optional appendix. Install UF on forwarder hosts only — not on Splunk Enterprise servers.',
      },
      {
        type: 'commands',
        content: 'On each UF host:',
        commands: [
          'wget -O splunkforwarder-{{SPLUNK_VERSION}}-linux-amd64.tgz "https://download.splunk.com/products/universalforwarder/releases/{{SPLUNK_VERSION}}/linux/splunkforwarder-{{SPLUNK_VERSION}}-linux-amd64.tgz"',
          'sudo mkdir -p /opt/splunkforwarder && sudo chown {{OS_USER}}:{{OS_USER}} /opt/splunkforwarder',
          'tar -xzf splunkforwarder-*.tgz -C /opt',
          '/opt/splunkforwarder/bin/splunk start --accept-license',
          'sudo /opt/splunkforwarder/bin/splunk enable boot-start -user {{OS_USER}} -systemd-managed 1',
        ],
      },
    ],
  },
  {
    id: 'uf-ds-poll',
    phase: 'APPENDIX B',
    title: 'Forwarders poll Deployment Server',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['uf-all'],
    optional: true,
    docLinks: [{ label: 'Deployment server', url: GUIDE_DOC_LINKS.deploymentServer }],
    blocks: [
      {
        type: 'commands',
        content: 'Point UF to DS (or mgmt if DS colocated):',
        commands: [
          '/opt/splunkforwarder/bin/splunk set deploy-poll {{DS_IP}}:8089',
          '/opt/splunkforwarder/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content:
          'On DS: **Settings → Forwarder Management** — create server classes and assign forwarders. Enable forwarder monitoring in MC.',
      },
    ],
  },
  {
    id: 'indexer-discovery',
    phase: 'APPENDIX C',
    title: 'Indexer discovery for forwarder outputs',
    profiles: ['distributed_ic', 'distributed_ic_shc'],
    targets: ['cm', 'ds'],
    optional: true,
    docLinks: [{ label: 'Indexer discovery', url: GUIDE_DOC_LINKS.deploymentServer }],
    blocks: [
      {
        type: 'commands',
        content: 'On Cluster Manager — enable indexer discovery:',
        commands: [
          'vi /opt/splunk/etc/system/local/server.conf',
          '[indexer_discovery]',
          'pass4SymmKey = {{CLUSTER_FWD_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        content: 'Deployment app outputs.conf example:',
        commands: [
          '[tcpout:default-autolb-group]',
          'indexerDiscovery = idxc1',
          'useACK = true',
          '',
          '[indexer_discovery:idxc1]',
          'master_uri = https://{{CM_IP}}:8089',
          'pass4SymmKey = {{CLUSTER_FWD_SECRET}}',
        ],
      },
    ],
  },
];

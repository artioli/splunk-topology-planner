import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const shcSteps: GuideStep[] = [
  {
    id: 'shc-deployer',
    phase: 'STEP 6',
    title: 'Configure SHC Deployer',
    profiles: ['distributed_ic_shc'],
    targets: ['deployer'],
    docLinks: [{ label: 'Deployer requirements', url: GUIDE_DOC_LINKS.deployer }],
    blocks: [
      {
        type: 'commands',
        content: 'On deployer {{DEPLOYER_HOST}}:',
        commands: [
          '/opt/splunk/bin/splunk set servername {{DEPLOYER_HOST}}',
          '/opt/splunk/bin/splunk edit cluster-config -mode searchhead -manager_uri https://{{CM_IP}}:8089 -secret {{CLUSTER_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
    ],
  },
  {
    id: 'shc-members',
    phase: 'STEP 7',
    title: 'Initialize search head cluster members',
    profiles: ['distributed_ic_shc'],
    targets: ['sh-all'],
    docLinks: [{ label: 'Deploy a search head cluster', url: GUIDE_DOC_LINKS.searchHeadCluster }],
    blocks: [
      {
        type: 'text',
        content: 'Minimum 3 SHC members. Captain election requires odd member count (3, 5, …).',
      },
      {
        type: 'commands',
        content: 'On first member ({{SH1_HOST}}) — initialize cluster:',
        commands: [
          '/opt/splunk/bin/splunk init shcluster-config -auth admin:{{ADMIN_PASSWORD}} -mgmt_uri https://{{SH1_IP}}:8089 -replication_port 8181 -replication_factor 3 -conf_deploy_fetch_url https://{{DEPLOYER_IP}}:8089 -secret {{CLUSTER_SECRET}} -shcluster_label shc1',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        content: 'On members 2 and 3 — join cluster:',
        commands: [
          '/opt/splunk/bin/splunk init shcluster-config -auth admin:{{ADMIN_PASSWORD}} -mgmt_uri https://<SH_IP>:8089 -replication_port 8181 -replication_factor 3 -conf_deploy_fetch_url https://{{DEPLOYER_IP}}:8089 -secret {{CLUSTER_SECRET}} -shcluster_label shc1',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        content: 'Elect captain (on any member):',
        commands: [
          '/opt/splunk/bin/splunk bootstrap shcluster-captain -servers_list "{{SH1_IP}}:8089,{{SH2_IP}}:8089,{{SH3_IP}}:8089"',
          '/opt/splunk/bin/splunk list shcluster-members',
        ],
      },
    ],
  },
  {
    id: 'shc-dedicated-ds',
    phase: 'STEP 6b',
    title: 'Configure dedicated Deployment Server',
    profiles: ['distributed_ic_shc'],
    targets: ['ds'],
    docLinks: [{ label: 'Deployment server', url: GUIDE_DOC_LINKS.deploymentServer }],
    blocks: [
      {
        type: 'commands',
        content: 'On DS {{DS_HOST}} — dedicated (not colocated with CM):',
        commands: [
          '/opt/splunk/bin/splunk set servername {{DS_HOST}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        content: 'MC role: Deployment Server.',
      },
    ],
  },
];

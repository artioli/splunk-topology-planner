import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const shcSteps: GuideStep[] = [
  {
    id: 'shc-deployer',
    profiles: ['distributed_ic_shc'],
    targets: ['deployer'],
    docLinks: [{ labelKey: 'guide.docs.deployer', url: GUIDE_DOC_LINKS.deployer }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.shc-deployer.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{DEPLOYER_HOST}}',
          '/opt/splunk/bin/splunk edit cluster-config -mode searchhead -manager_uri https://{{CM_IP}}:8089 -secret {{CLUSTER_SECRET}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
    ],
    validations: [
      {
        id: 'deployer',
        labelKey: 'steps.shc-deployer.validations.deployer.label',
        expectKey: 'steps.shc-deployer.validations.deployer.expect',
      },
    ],
  },
  {
    id: 'shc-members',
    profiles: ['distributed_ic_shc'],
    targets: ['sh-all'],
    docLinks: [{ labelKey: 'guide.docs.searchHeadCluster', url: GUIDE_DOC_LINKS.searchHeadCluster }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.shc-members.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.shc-members.blocks.init-first',
        commands: [
          '/opt/splunk/bin/splunk init shcluster-config -auth admin:{{ADMIN_PASSWORD}} -mgmt_uri https://{{SH1_IP}}:8089 -replication_port 8181 -replication_factor 3 -conf_deploy_fetch_url https://{{DEPLOYER_IP}}:8089 -secret {{CLUSTER_SECRET}} -shcluster_label shc1',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.shc-members.blocks.join-members',
        commands: [
          '/opt/splunk/bin/splunk init shcluster-config -auth admin:{{ADMIN_PASSWORD}} -mgmt_uri https://<SH_IP>:8089 -replication_port 8181 -replication_factor 3 -conf_deploy_fetch_url https://{{DEPLOYER_IP}}:8089 -secret {{CLUSTER_SECRET}} -shcluster_label shc1',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.shc-members.blocks.elect-captain',
        commands: [
          '/opt/splunk/bin/splunk bootstrap shcluster-captain -servers_list "{{SH1_IP}}:8089,{{SH2_IP}}:8089,{{SH3_IP}}:8089"',
          '/opt/splunk/bin/splunk list shcluster-members',
        ],
      },
    ],
    validations: [
      {
        id: 'members',
        labelKey: 'steps.shc-members.validations.members.label',
        command: '/opt/splunk/bin/splunk list shcluster-members',
        expectKey: 'steps.shc-members.validations.members.expect',
      },
    ],
  },
  {
    id: 'shc-dedicated-ds',
    profiles: ['distributed_ic_shc'],
    targets: ['ds'],
    docLinks: [{ labelKey: 'guide.docs.deploymentServer', url: GUIDE_DOC_LINKS.deploymentServer }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.shc-dedicated-ds.blocks.configure',
        commands: [
          '/opt/splunk/bin/splunk set servername {{DS_HOST}}',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.shc-dedicated-ds.blocks.mc-role',
      },
    ],
    validations: [
      {
        id: 'ds',
        labelKey: 'steps.shc-dedicated-ds.validations.ds.label',
        expectKey: 'steps.shc-dedicated-ds.validations.ds.expect',
      },
    ],
  },
];

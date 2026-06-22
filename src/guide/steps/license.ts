import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

const ALL_PROFILES = ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'] as const;

export const licenseSteps: GuideStep[] = [
  {
    id: 'license-manager',
    profiles: [...ALL_PROFILES],
    targets: ['mgmt', 'combined'],
    docLinks: [{ labelKey: 'guide.docs.licenseManager', url: GUIDE_DOC_LINKS.licenseManager }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.license-manager.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.license-manager.blocks.add-license',
        profiles: ['single'],
        commands: [
          'ssh {{OS_USER}}@{{MGMT_IP}}',
          '/opt/splunk/bin/splunk status',
          'sudo mkdir -p /opt/license && sudo chown {{OS_USER}}:{{OS_USER}} /opt/license',
          '# Copy your .license file to {{LICENSE_PATH}}',
          '/opt/splunk/bin/splunk add licenses {{LICENSE_PATH}}',
          '/opt/splunk/bin/splunk set servername {{MGMT_HOST}}-single',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.license-manager.blocks.add-license',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
        commands: [
          'ssh {{OS_USER}}@{{MGMT_IP}}',
          '/opt/splunk/bin/splunk status',
          'sudo mkdir -p /opt/license && sudo chown {{OS_USER}}:{{OS_USER}} /opt/license',
          '# Copy your .license file to {{LICENSE_PATH}}',
          '/opt/splunk/bin/splunk add licenses {{LICENSE_PATH}}',
          '/opt/splunk/bin/splunk set servername {{MGMT_HOST}}-lm',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.license-manager.blocks.web-https',
      },
      {
        type: 'text',
        contentKey: 'steps.license-manager.blocks.mc-roles',
      },
    ],
    validations: [
      {
        id: 'license',
        labelKey: 'steps.license-manager.validations.license.label',
        expectKey: 'steps.license-manager.validations.license.expect',
      },
    ],
  },
  {
    id: 'license-slaves',
    profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['idx-all', 'sh-all', 'cm', 'deployer', 'ds'],
    docLinks: [{ labelKey: 'guide.docs.licenseManager', url: GUIDE_DOC_LINKS.licenseManager }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.license-slaves.blocks.register',
        commands: [
          '/opt/splunk/bin/splunk edit licenser-localslave -master_uri https://{{LM_IP}}:8089',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.license-slaves.blocks.verify',
        commands: ['/opt/splunk/bin/splunk list licenser-slaves'],
      },
    ],
    validations: [
      {
        id: 'slaves',
        labelKey: 'steps.license-slaves.validations.slaves.label',
        command: '/opt/splunk/bin/splunk list licenser-slaves',
        expectKey: 'steps.license-slaves.validations.slaves.expect',
      },
    ],
  },
  {
    id: 'license-slave-single',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ labelKey: 'guide.docs.licenseManager', url: GUIDE_DOC_LINKS.licenseManager }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.license-slave-single.blocks.intro',
      },
    ],
    validations: [
      {
        id: 'local',
        labelKey: 'steps.license-slave-single.validations.local.label',
        expectKey: 'steps.license-slave-single.validations.local.expect',
      },
    ],
  },
];

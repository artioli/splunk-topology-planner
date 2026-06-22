import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const validationSteps: GuideStep[] = [
  {
    id: 'validation-single',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [
      { labelKey: 'guide.docs.monitoringConsole', url: GUIDE_DOC_LINKS.monitoringConsole },
      { labelKey: 'guide.docs.networkPorts', url: GUIDE_DOC_LINKS.networkPorts },
    ],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.validation-single.blocks.cli-checks',
        commands: [
          '/opt/splunk/bin/splunk status',
          '/opt/splunk/bin/splunk show listen',
          '/opt/splunk/bin/splunk list licenser-messages',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.validation.blocks.mc-health',
      },
    ],
    validations: [
      {
        id: 'health',
        labelKey: 'steps.validation.validations.health.label',
        expectKey: 'steps.validation.validations.health.expect',
      },
    ],
  },
  {
    id: 'validation',
    profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt', 'combined'],
    docLinks: [
      { labelKey: 'guide.docs.monitoringConsole', url: GUIDE_DOC_LINKS.monitoringConsole },
      { labelKey: 'guide.docs.networkPorts', url: GUIDE_DOC_LINKS.networkPorts },
    ],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.validation.blocks.cli-checks-nc',
        profiles: ['distributed_nc'],
        commands: [
          '/opt/splunk/bin/splunk list licenser-slaves',
          '/opt/splunk/bin/splunk show listen',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.validation.blocks.cli-checks-ic',
        profiles: ['distributed_ic'],
        commands: [
          '/opt/splunk/bin/splunk list licenser-slaves',
          '/opt/splunk/bin/splunk show cluster-status',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.validation.blocks.cli-checks-ic-shc',
        profiles: ['distributed_ic_shc'],
        commands: [
          '/opt/splunk/bin/splunk list licenser-slaves',
          '/opt/splunk/bin/splunk show cluster-status',
          '/opt/splunk/bin/splunk list shcluster-members',
          '/opt/splunk/bin/splunk list deploy-server-clients',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.validation.blocks.mc-health',
      },
      {
        type: 'text',
        contentKey: 'steps.validation.blocks.internal-forward',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
      },
    ],
    validations: [
      {
        id: 'health',
        labelKey: 'steps.validation.validations.health.label',
        expectKey: 'steps.validation.validations.health.expect',
      },
    ],
  },
];

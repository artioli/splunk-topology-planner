import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const validationSteps: GuideStep[] = [
  {
    id: 'validation',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt', 'combined'],
    docLinks: [
      { labelKey: 'guide.docs.monitoringConsole', url: GUIDE_DOC_LINKS.monitoringConsole },
      { labelKey: 'guide.docs.networkPorts', url: GUIDE_DOC_LINKS.networkPorts },
    ],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.validation.blocks.cli-checks',
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

import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const validationSteps: GuideStep[] = [
  {
    id: 'validation',
    phase: 'STEP 10',
    title: 'Validation and health check',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt', 'combined'],
    docLinks: [
      { label: 'Monitoring Console health', url: GUIDE_DOC_LINKS.monitoringConsole },
      { label: 'Network ports', url: GUIDE_DOC_LINKS.networkPorts },
    ],
    blocks: [
      {
        type: 'commands',
        content: 'CLI checks:',
        commands: [
          '/opt/splunk/bin/splunk list licenser-slaves',
          '/opt/splunk/bin/splunk show cluster-status',
          '/opt/splunk/bin/splunk list shcluster-members',
          '/opt/splunk/bin/splunk list deploy-server-clients',
        ],
      },
      {
        type: 'text',
        content:
          'Splunk Web → **Settings → Monitoring Console → Health Check**. All checks should pass (hardware warnings may appear in undersized labs).',
      },
      {
        type: 'text',
        content:
          'Confirm internal logs are forwarding from management/search tiers to indexers when indexing is disabled on those nodes.',
      },
    ],
  },
];

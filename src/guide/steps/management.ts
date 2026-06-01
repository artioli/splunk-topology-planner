import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

export const managementSteps: GuideStep[] = [
  {
    id: 'monitoring-console',
    profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['mgmt'],
    docLinks: [{ labelKey: 'guide.docs.monitoringConsole', url: GUIDE_DOC_LINKS.monitoringConsole }],
    blocks: [
      {
        type: 'commands',
        contentKey: 'steps.monitoring-console.blocks.add-servers',
        commands: [
          '/opt/splunk/bin/splunk add search-server https://{{IDX1_IP}}:8089 -remoteUsername admin -remotePassword {{ADMIN_PASSWORD}}',
          '# Repeat for each indexer, SH, CM, DS as applicable',
          '/opt/splunk/bin/splunk restart',
        ],
      },
      {
        type: 'text',
        contentKey: 'steps.monitoring-console.blocks.distributed-mode',
      },
    ],
    validations: [
      {
        id: 'mc',
        labelKey: 'steps.monitoring-console.validations.mc.label',
        expectKey: 'steps.monitoring-console.validations.mc.expect',
      },
    ],
  },
  {
    id: 'monitoring-console-single',
    profiles: ['single'],
    targets: ['combined'],
    docLinks: [{ labelKey: 'guide.docs.monitoringConsole', url: GUIDE_DOC_LINKS.monitoringConsole }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.monitoring-console-single.blocks.intro',
      },
    ],
    validations: [
      {
        id: 'standalone',
        labelKey: 'steps.monitoring-console-single.validations.standalone.label',
        expectKey: 'steps.monitoring-console-single.validations.standalone.expect',
      },
    ],
  },
];

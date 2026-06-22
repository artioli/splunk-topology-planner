import { GUIDE_DOC_LINKS } from '../docLinks';
import type { GuideStep } from '../types';

/** TLS and HEC setup — production-oriented (lab callouts where shortcuts exist). */
export const tlsHecSteps: GuideStep[] = [
  {
    id: 'tls-web',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['combined', 'sh1', 'sh-all'],
    docLinks: [
      { labelKey: 'guide.docs.networkPorts', url: GUIDE_DOC_LINKS.networkPorts },
      { labelKey: 'guide.docs.systemRequirements', url: GUIDE_DOC_LINKS.systemRequirements },
    ],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.tls-web.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.tls-web.blocks.self-signed',
        profiles: ['single'],
        commands: [
          'cd $SPLUNK_HOME/etc/auth',
          'sudo -u {{OS_USER}} openssl req -new -x509 -days 365 -nodes -out server.pem -keyout server.pem -subj "/CN={{MGMT_HOST}}"',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.tls-web.blocks.self-signed',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
        commands: [
          'cd $SPLUNK_HOME/etc/auth',
          'sudo -u {{OS_USER}} openssl req -new -x509 -days 365 -nodes -out server.pem -keyout server.pem -subj "/CN={{SH1_HOST}}"',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.tls-web.blocks.open-server-conf',
        commands: ['vi $SPLUNK_HOME/etc/system/local/server.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.tls-web.blocks.paste-ssl',
        copyAsBlock: true,
        commands: [
          '[sslConfig]',
          'enableSplunkdSSL = true',
          'sslPassword = password',
          'serverCert = $SPLUNK_HOME/etc/auth/server.pem',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.tls-web.blocks.restart',
        commands: ['/opt/splunk/bin/splunk restart'],
      },
      {
        type: 'warning',
        contentKey: 'steps.tls-web.blocks.production-warning',
      },
    ],
    validations: [
      {
        id: 'https',
        labelKey: 'steps.tls-web.validations.https.label',
        expectKey: 'steps.tls-web.validations.https.expect',
      },
    ],
  },
  {
    id: 'hec-tokens',
    profiles: ['single', 'distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
    targets: ['combined', 'idx1', 'idx-all'],
    docLinks: [{ labelKey: 'guide.docs.networkPorts', url: GUIDE_DOC_LINKS.networkPorts }],
    blocks: [
      {
        type: 'text',
        contentKey: 'steps.hec-tokens.blocks.intro',
      },
      {
        type: 'commands',
        contentKey: 'steps.hec-tokens.blocks.open-inputs',
        commands: ['vi $SPLUNK_HOME/etc/apps/splunk_httpinput/local/inputs.conf'],
      },
      {
        type: 'commands',
        contentKey: 'steps.hec-tokens.blocks.paste-http',
        copyAsBlock: true,
        commands: ['[http]', 'disabled = 0', 'port = 8088', 'enableSSL = 1'],
      },
      {
        type: 'commands',
        contentKey: 'steps.hec-tokens.blocks.paste-token',
        copyAsBlock: true,
        commands: [
          '[http://lab_hec]',
          'token = <generate-unique-token>',
          'index = main',
          'sourcetype = _json',
        ],
      },
      {
        type: 'commands',
        contentKey: 'steps.hec-tokens.blocks.restart',
        commands: ['/opt/splunk/bin/splunk restart'],
      },
      {
        type: 'text',
        contentKey: 'steps.hec-tokens.blocks.firewall-single',
        profiles: ['single'],
      },
      {
        type: 'text',
        contentKey: 'steps.hec-tokens.blocks.firewall',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
      },
      {
        type: 'warning',
        contentKey: 'steps.hec-tokens.blocks.lab-warning',
      },
    ],
    validations: [
      {
        id: 'hec',
        labelKey: 'steps.hec-tokens.validations.hec.label',
        command: 'curl -k https://{{MGMT_HOST}}:8088/services/collector/health',
        expectKey: 'steps.hec-tokens.validations.hec.expect',
        profiles: ['single'],
      },
      {
        id: 'hec',
        labelKey: 'steps.hec-tokens.validations.hec.label',
        command: 'curl -k https://{{IDX1_HOST}}:8088/services/collector/health',
        expectKey: 'steps.hec-tokens.validations.hec.expect',
        profiles: ['distributed_nc', 'distributed_ic', 'distributed_ic_shc'],
      },
    ],
  },
];

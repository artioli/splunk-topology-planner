import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../src/i18n/locales');
mkdirSync(outDir, { recursive: true });

/** @type {Record<string, Record<string, string>>} */
const catalogs = { en: {}, pt: {}, es: {} };

function add(key, en, pt, es) {
  catalogs.en[key] = en;
  catalogs.pt[key] = pt;
  catalogs.es[key] = es;
}

// --- NAV / UI ---
add('nav.brand', 'Splunk Planner', 'Splunk Planner', 'Splunk Planner');
add('nav.planner', 'Topology Planner', 'Planejador de topologia', 'Planificador de topología');
add('nav.guide', 'Deployment Guide', 'Guia de implantação', 'Guía de implementación');
add('nav.themeToggle', 'Toggle color theme', 'Alternar tema de cor', 'Alternar tema de color');
add('nav.langLabel', 'Language', 'Idioma', 'Idioma');

add('guide.title', 'Splunk Linux Deployment Guide', 'Guia de implantação Splunk Linux', 'Guía de implementación Splunk Linux');
add('guide.subtitle', 'Step-by-step lab deployment for RHEL-family Linux · Topology planner', 'Implantação passo a passo para laboratório em Linux RHEL · Planejador de topologia', 'Implementación paso a paso para laboratorio en Linux RHEL · Planificador de topología');
add('guide.subtitleDistro', 'Step-by-step lab deployment for {distro} · Topology planner', 'Implantação passo a passo para laboratório em {distro} · Planejador de topologia', 'Implementación paso a paso para laboratorio en {distro} · Planificador de topología');
add('guide.profileHeader', 'Choose deployment profile', 'Escolher perfil de implantação', 'Elegir perfil de implementación');
add('guide.profileHint', 'Sized with the planner? S1 → Single · D1 → Distributed NC · C1 → IC · C3 → IC + SHC', 'Dimensionado com o planejador? S1 → Single · D1 → Distributed NC · C1 → IC · C3 → IC + SHC', '¿Dimensionado con el planificador? S1 → Single · D1 → Distributed NC · C1 → IC · C3 → IC + SHC');
add('guide.hostConfig', 'Host configuration', 'Configuração de hosts', 'Configuración de hosts');
add('guide.osUser', 'OS user', 'Utilizador OS', 'Usuario OS');
add('guide.splunkVersion', 'Splunk version', 'Versão Splunk', 'Versión Splunk');
add('guide.adminPassword', 'Splunk admin password (placeholder)', 'Palavra-passe admin Splunk (placeholder)', 'Contraseña admin Splunk (placeholder)');
add('guide.clusterSecret', 'Cluster secret', 'Segredo do cluster', 'Secreto del cluster');
add('guide.includeForwarders', 'Include Universal Forwarder appendix', 'Incluir apêndice Universal Forwarder', 'Incluir apéndice Universal Forwarder');
add('guide.showCompleted', 'Show completed steps', 'Mostrar passos concluídos', 'Mostrar pasos completados');
add('guide.copyMarkdown', 'Copy guide (Markdown)', 'Copiar guia (Markdown)', 'Copiar guía (Markdown)');
add('guide.copy', 'Copy', 'Copiar', 'Copiar');
add('guide.copyBlock', 'Copy block', 'Copiar bloco', 'Copiar bloque');
add('guide.copied', 'Copied!', 'Copiado!', '¡Copiado!');
add('guide.progress', '{done} / {total} steps complete', '{done} / {total} passos concluídos', '{done} / {total} pasos completados');
add('guide.jumpToStep', 'Jump to step', 'Ir para o passo', 'Ir al paso');
add('guide.markComplete', 'Mark step complete', 'Marcar passo como concluído', 'Marcar paso como completado');
add('guide.handoff', 'Planner handoff: {svaCode} → {profileLabel}', 'Handoff do planejador: {svaCode} → {profileLabel}', 'Transferencia del planificador: {svaCode} → {profileLabel}');
add('guide.handoffDetail', '{indexerCount} indexer(s){shcSuffix}', '{indexerCount} indexer(s){shcSuffix}', '{indexerCount} indexer(s){shcSuffix}');
add('guide.linuxDistro', 'Linux distribution', 'Distribuição Linux', 'Distribución Linux');
add('guide.distros.rhel', 'RHEL / Rocky / Alma', 'RHEL / Rocky / Alma', 'RHEL / Rocky / Alma');
add('guide.distros.ubuntu', 'Ubuntu', 'Ubuntu', 'Ubuntu');
add('guide.distros.debian', 'Debian', 'Debian', 'Debian');
add('guide.hostRole', 'Role', 'Função', 'Rol');
add('guide.hostname', 'Hostname', 'Nome do host', 'Nombre de host');
add('guide.hostIp', 'IP', 'IP', 'IP');
add('guide.ubuntuCallout', 'Ubuntu / Debian', 'Ubuntu / Debian', 'Ubuntu / Debian');
add('guide.hostsBadge', '{count} hosts', '{count} hosts', '{count} hosts');

add('guide.validations.title', 'Validations', 'Validações', 'Validaciones');
add('guide.validations.verified', 'Verified', 'Verificado', 'Verificado');
add('guide.validations.pastePlaceholder', 'Paste command output here…', 'Cole a saída do comando aqui…', 'Pegue la salida del comando aquí…');
add('guide.validations.optional', 'optional', 'opcional', 'opcional');
add('guide.validations.checkOutput', 'Check output', 'Verificar saída', 'Comprobar salida');
add('guide.validations.pass', 'Pass', 'Aprovado', 'Aprobado');
add('guide.validations.fail', 'Fail', 'Falhou', 'Fallo');
add('guide.validations.skipLab', 'Skip in lab', 'Ignorar no laboratório', 'Omitir en laboratorio');
add('guide.validations.completeBlocked', 'Complete all validations before marking this step done.', 'Conclua todas as validações antes de marcar este passo como feito.', 'Complete todas las validaciones antes de marcar este paso como hecho.');

// --- TARGETS ---
const targets = {
  'guide.targets.all-splunk': ['All Splunk Enterprise hosts', 'Todos os hosts Splunk Enterprise', 'Todos los hosts Splunk Enterprise'],
  'guide.targets.mgmt': ['Management (LM+MC)', 'Management (LM+MC)', 'Management (LM+MC)'],
  'guide.targets.combined': ['Combined server', 'Servidor combinado', 'Servidor combinado'],
  'guide.targets.idx1': ['Indexer 1', 'Indexer 1', 'Indexer 1'],
  'guide.targets.idx2': ['Indexer 2', 'Indexer 2', 'Indexer 2'],
  'guide.targets.idx3': ['Indexer 3', 'Indexer 3', 'Indexer 3'],
  'guide.targets.idx-all': ['All indexers (multi-exec)', 'Todos os indexers (multi-exec)', 'Todos los indexers (multi-exec)'],
  'guide.targets.sh1': ['Search head 1', 'Search head 1', 'Search head 1'],
  'guide.targets.sh-all': ['All search heads (multi-exec)', 'Todos os search heads (multi-exec)', 'Todos los search heads (multi-exec)'],
  'guide.targets.cm': ['Cluster Manager', 'Cluster Manager', 'Cluster Manager'],
  'guide.targets.deployer': ['SHC Deployer', 'SHC Deployer', 'SHC Deployer'],
  'guide.targets.ds': ['Deployment Server', 'Deployment Server', 'Deployment Server'],
  'guide.targets.uf-all': ['All forwarders', 'Todos os forwarders', 'Todos los forwarders'],
  'guide.targets.uf1': ['UF 1', 'UF 1', 'UF 1'],
  'guide.targets.uf2': ['UF 2', 'UF 2', 'UF 2'],
};
for (const [k, [en, pt, es]] of Object.entries(targets)) add(k, en, pt, es);

// --- PROFILES ---
add('profiles.single.label', 'Single server', 'Servidor único', 'Servidor único');
add('profiles.single.description', '1× combined Splunk Enterprise (indexer + search + LM + MC + DS on one host).', '1× Splunk Enterprise combinado (indexer + search + LM + MC + DS num host).', '1× Splunk Enterprise combinado (indexer + search + LM + MC + DS en un host).');
add('profiles.single.svaHint', 'Maps to SVA S1', 'Corresponde a SVA S1', 'Corresponde a SVA S1');
add('profiles.distributed_nc.label', 'Distributed non-cluster', 'Distribuído sem cluster', 'Distribuido sin cluster');
add('profiles.distributed_nc.description', '1× indexer, 1× search head, 1× management (LM + MC + DS colocated).', '1× indexer, 1× search head, 1× management (LM + MC + DS colocalizados).', '1× indexer, 1× search head, 1× management (LM + MC + DS colocalizados).');
add('profiles.distributed_nc.svaHint', 'Maps to SVA D1', 'Corresponde a SVA D1', 'Corresponde a SVA D1');
add('profiles.distributed_ic.label', 'Distributed + indexer cluster', 'Distribuído + indexer cluster', 'Distribuido + indexer cluster');
add('profiles.distributed_ic.description', '3× indexers, 1× Cluster Manager, 1× search head, 1× management (LM + MC + DS).', '3× indexers, 1× Cluster Manager, 1× search head, 1× management (LM + MC + DS).', '3× indexers, 1× Cluster Manager, 1× search head, 1× management (LM + MC + DS).');
add('profiles.distributed_ic.svaHint', 'Maps to SVA C1', 'Corresponde a SVA C1', 'Corresponde a SVA C1');
add('profiles.distributed_ic_shc.label', 'Distributed + IC + SHC', 'Distribuído + IC + SHC', 'Distribuido + IC + SHC');
add('profiles.distributed_ic_shc.description', '3× indexers, 1× CM, 3× search heads, 1× SHC deployer, 1× DS, 1× management (LM + MC).', '3× indexers, 1× CM, 3× search heads, 1× SHC deployer, 1× DS, 1× management (LM + MC).', '3× indexers, 1× CM, 3× search heads, 1× SHC deployer, 1× DS, 1× management (LM + MC).');
add('profiles.distributed_ic_shc.svaHint', 'Maps to SVA C3', 'Corresponde a SVA C3', 'Corresponde a SVA C3');

// --- STEPS: linux-tips ---
add('steps.linux-tips.phase', 'STEP 0', 'PASSO 0', 'PASO 0');
add('steps.linux-tips.title', 'Linux quick tips', 'Dicas rápidas Linux', 'Consejos rápidos Linux');
add('steps.linux-tips.blocks.intro', 'Run commands in order. Comments start with #. When a step says multi-exec, run the same commands on every listed host (MobaXterm multi-exec, parallel SSH, or repeat manually).', 'Execute os comandos por ordem. Comentários começam com #. Quando um passo indicar multi-exec, execute os mesmos comandos em cada host listado (MobaXterm multi-exec, SSH paralelo ou manualmente).', 'Ejecute los comandos en orden. Los comentarios empiezan con #. Cuando un paso indique multi-exec, ejecute los mismos comandos en cada host listado (MobaXterm multi-exec, SSH paralelo o manualmente).');
add('steps.linux-tips.blocks.vi-basics', '**vi basics:** `i` = insert, `Esc` = command mode, `:wq` = save and quit, `:q!` = quit without saving. `nano` is acceptable if you prefer.', '**Básicos do vi:** `i` = inserir, `Esc` = modo comando, `:wq` = guardar e sair, `:q!` = sair sem guardar. `nano` é aceitável se preferir.', '**Conceptos básicos de vi:** `i` = insertar, `Esc` = modo comando, `:wq` = guardar y salir, `:q!` = salir sin guardar. `nano` es aceptable si lo prefiere.');
add('steps.linux-tips.blocks.disk-check', 'Check disk space before installing Splunk (need separate OS and data volumes on indexers):', 'Verifique espaço em disco antes de instalar Splunk (indexers precisam de volumes OS e dados separados):', 'Compruebe el espacio en disco antes de instalar Splunk (los indexers necesitan volúmenes OS y de datos separados):');
add('steps.linux-tips.blocks.ssh-admin', 'SSH to a host as your admin user, then switch to the Splunk OS user when needed:', 'Ligue por SSH ao host como utilizador admin e mude para o utilizador OS Splunk quando necessário:', 'Conéctese por SSH al host como usuario admin y cambie al usuario OS Splunk cuando sea necesario:');
add('steps.linux-tips.blocks.firewall-lab', 'Lab shortcut: some training environments disable firewalld entirely. In production, open only required TCP ports (8000, 8089, 9997, 8088, cluster ports) instead of disabling the firewall.', 'Atalho de laboratório: alguns ambientes de formação desativam o firewalld por completo. Em produção, abra apenas as portas TCP necessárias (8000, 8089, 9997, 8088, portas de cluster) em vez de desativar a firewall.', 'Atajo de laboratorio: algunos entornos de formación desactivan firewalld por completo. En producción, abra solo los puertos TCP necesarios (8000, 8089, 9997, 8088, puertos de cluster) en lugar de desactivar el firewall.');
add('steps.linux-tips.validations.disk.label', 'Disk space check', 'Verificação de espaço em disco', 'Comprobación de espacio en disco');
add('steps.linux-tips.validations.disk.expect', '`df -h` shows adequate free space; indexers have a dedicated data volume separate from `/`.', '`df -h` mostra espaço livre adequado; indexers têm volume de dados dedicado separado de `/`.', '`df -h` muestra espacio libre adecuado; los indexers tienen un volumen de datos dedicado separado de `/`.');
add('steps.linux-tips.validations.whoami.label', 'Current user', 'Utilizador atual', 'Usuario actual');
add('steps.linux-tips.validations.whoami.expect', '`whoami` returns your expected admin or Splunk OS user.', '`whoami` devolve o utilizador admin ou OS Splunk esperado.', '`whoami` devuelve el usuario admin u OS Splunk esperado.');

// --- STEPS: os-prep ---
add('steps.os-prep.phase', 'STEP 1', 'PASSO 1', 'PASO 1');
add('steps.os-prep.title', 'OS prerequisites (all Splunk Enterprise hosts)', 'Pré-requisitos OS (todos os hosts Splunk Enterprise)', 'Requisitos previos OS (todos los hosts Splunk Enterprise)');
add('steps.os-prep.blocks.intro', 'Create OS user **{{OS_USER}}** on every Splunk host. Splunk should not run as root. Use dedicated data volumes for indexers.', 'Crie o utilizador OS **{{OS_USER}}** em cada host Splunk. Splunk não deve correr como root. Use volumes de dados dedicados para indexers.', 'Cree el usuario OS **{{OS_USER}}** en cada host Splunk. Splunk no debe ejecutarse como root. Use volúmenes de datos dedicados para indexers.');
add('steps.os-prep.blocks.create-user', 'Create splunkuser (run as root on each host):', 'Criar splunkuser (executar como root em cada host):', 'Crear splunkuser (ejecutar como root en cada host):');
add('steps.os-prep.blocks.ulimits-check', 'RHEL — check current ulimits for {{OS_USER}}:', 'RHEL — verificar ulimits atuais para {{OS_USER}}:', 'RHEL — comprobar ulimits actuales para {{OS_USER}}:');
add('steps.os-prep.blocks.limits-open', 'Open /etc/security/limits.conf and append the block below:', 'Abrir /etc/security/limits.conf e acrescentar o bloco abaixo:', 'Abrir /etc/security/limits.conf y añadir el bloque siguiente:');
add('steps.os-prep.blocks.limits-append', 'Append to limits.conf:', 'Acrescentar a limits.conf:', 'Añadir a limits.conf:');
add('steps.os-prep.blocks.chrony', '**Best practice:** synchronize time on all Splunk hosts with `chrony` or NTP. Splunk clustering, SHC captain election, and license reporting depend on consistent clocks. On RHEL: `sudo dnf install -y chrony && sudo systemctl enable --now chronyd`. Verify with `chronyc tracking`.', '**Melhor prática:** sincronize a hora em todos os hosts Splunk com `chrony` ou NTP. Clustering Splunk, eleição de captain SHC e relatórios de licença dependem de relógios consistentes. Em RHEL: `sudo dnf install -y chrony && sudo systemctl enable --now chronyd`. Verifique com `chronyc tracking`.', '**Buena práctica:** sincronice la hora en todos los hosts Splunk con `chrony` o NTP. El clustering Splunk, la elección de captain SHC y los informes de licencia dependen de relojes consistentes. En RHEL: `sudo dnf install -y chrony && sudo systemctl enable --now chronyd`. Verifique con `chronyc tracking`.');
add('steps.os-prep.blocks.selinux', '**Best practice (RHEL):** Splunk supports SELinux in enforcing mode when properly labeled. For labs you may set `SELINUX=permissive` in `/etc/selinux/config` after reboot. Production: follow Splunk documentation for SELinux contexts on `$SPLUNK_HOME` and data paths rather than disabling SELinux.', '**Melhor prática (RHEL):** Splunk suporta SELinux em modo enforcing quando corretamente etiquetado. Em laboratórios pode definir `SELINUX=permissive` em `/etc/selinux/config` após reboot. Produção: siga a documentação Splunk para contextos SELinux em `$SPLUNK_HOME` e caminhos de dados em vez de desativar SELinux.', '**Buena práctica (RHEL):** Splunk admite SELinux en modo enforcing cuando está correctamente etiquetado. En laboratorios puede establecer `SELINUX=permissive` en `/etc/selinux/config` tras reiniciar. Producción: siga la documentación Splunk para contextos SELinux en `$SPLUNK_HOME` y rutas de datos en lugar de desactivar SELinux.');
add('steps.os-prep.blocks.indexer-volume', '**Best practice (indexers):** mount a dedicated XFS or ext4 volume (e.g. `/splunkdata`) for `$SPLUNK_DB`, separate from the OS root volume. Size per your capacity plan; avoid filling `/` with indexed data.', '**Melhor prática (indexers):** monte um volume XFS ou ext4 dedicado (ex.: `/splunkdata`) para `$SPLUNK_DB`, separado do volume root OS. Dimensione conforme o plano de capacidade; evite encher `/` com dados indexados.', '**Buena práctica (indexers):** monte un volumen XFS o ext4 dedicado (p. ej. `/splunkdata`) para `$SPLUNK_DB`, separado del volumen root OS. Dimensione según su plan de capacidad; evite llenar `/` con datos indexados.');
add('steps.os-prep.blocks.ubuntu-note', 'Ubuntu/Debian: use the same limits in `/etc/security/limits.conf`. Package names differ (`apt` vs `yum`); THP path is the same under `/sys/kernel/mm/transparent_hugepage/enabled`.', 'Ubuntu/Debian: use os mesmos limites em `/etc/security/limits.conf`. Os nomes dos pacotes diferem (`apt` vs `yum`); o caminho THP é o mesmo em `/sys/kernel/mm/transparent_hugepage/enabled`.', 'Ubuntu/Debian: use los mismos límites en `/etc/security/limits.conf`. Los nombres de paquetes difieren (`apt` vs `yum`); la ruta THP es la misma en `/sys/kernel/mm/transparent_hugepage/enabled`.');
add('steps.os-prep.blocks.thp-check', 'Disable Transparent Huge Pages (THP) — check current setting:', 'Desativar Transparent Huge Pages (THP) — verificar definição atual:', 'Desactivar Transparent Huge Pages (THP) — comprobar configuración actual:');
add('steps.os-prep.blocks.grub-edit', 'Edit GRUB and add `transparent_hugepage=never` to GRUB_CMDLINE_LINUX:', 'Editar GRUB e adicionar `transparent_hugepage=never` a GRUB_CMDLINE_LINUX:', 'Editar GRUB y añadir `transparent_hugepage=never` a GRUB_CMDLINE_LINUX:');
add('steps.os-prep.blocks.grub-apply', 'Apply GRUB changes and reboot:', 'Aplicar alterações GRUB e reiniciar:', 'Aplicar cambios GRUB y reiniciar:');
add('steps.os-prep.blocks.firewalld-ports', 'RHEL — open required ports with firewalld (preferred over disabling):', 'RHEL — abrir portas necessárias com firewalld (preferível a desativar):', 'RHEL — abrir puertos necesarios con firewalld (preferible a desactivar):');
add('steps.os-prep.blocks.ufw-ports', 'Ubuntu/Debian — open required ports with ufw (preferred over disabling):', 'Ubuntu/Debian — abrir portas necessárias com ufw (preferível a desativar):', 'Ubuntu/Debian — abrir puertos necesarios con ufw (preferible a desactivar):');
add('steps.os-prep.blocks.firewall-lab', 'Lab only: `sudo systemctl stop firewalld && sudo systemctl disable firewalld` — do not use in production.', 'Apenas laboratório: `sudo systemctl stop firewalld && sudo systemctl disable firewalld` — não usar em produção.', 'Solo laboratorio: `sudo systemctl stop firewalld && sudo systemctl disable firewalld` — no usar en producción.');
add('steps.os-prep.blocks.firewall-lab-debian', 'Lab only: `sudo ufw disable` — do not use in production.', 'Apenas laboratório: `sudo ufw disable` — não usar em produção.', 'Solo laboratorio: `sudo ufw disable` — no usar en producción.');
add('steps.os-prep.validations.limits.label', 'Ulimits applied', 'Ulimits aplicados', 'Ulimits aplicados');
add('steps.os-prep.validations.limits.expect', 'After re-login, `ulimit -Sa` shows nofile ≥ 10240 for {{OS_USER}}.', 'Após novo login, `ulimit -Sa` mostra nofile ≥ 10240 para {{OS_USER}}.', 'Tras nuevo login, `ulimit -Sa` muestra nofile ≥ 10240 para {{OS_USER}}.');
add('steps.os-prep.validations.thp.label', 'THP disabled', 'THP desativado', 'THP desactivado');
add('steps.os-prep.validations.thp.expect', '`cat /sys/kernel/mm/transparent_hugepage/enabled` shows `[never]`.', '`cat /sys/kernel/mm/transparent_hugepage/enabled` mostra `[never]`.', '`cat /sys/kernel/mm/transparent_hugepage/enabled` muestra `[never]`.');
add('steps.os-prep.validations.firewall.label', 'Firewall ports open', 'Portas firewall abertas', 'Puertos firewall abiertos');
add('steps.os-prep.validations.firewall.expect', 'Required Splunk TCP ports (8000, 8089, 9997, 8088, 9887) are allowed or firewall disabled in lab.', 'Portas TCP Splunk necessárias (8000, 8089, 9997, 8088, 9887) permitidas ou firewall desativada no laboratório.', 'Puertos TCP Splunk necesarios (8000, 8089, 9997, 8088, 9887) permitidos o firewall desactivado en laboratorio.');

// --- GUIDE DOC LINK LABELS ---
add('guide.docs.referenceHardware', 'Reference hardware', 'Reference hardware', 'Reference hardware');
add('guide.docs.capacityManual', 'Capacity planning', 'Capacity planning', 'Capacity planning');
add('guide.docs.installLinux', 'Install on Linux (tgz)', 'Install on Linux (tgz)', 'Install on Linux (tgz)');
add('guide.docs.download', 'Download Splunk Enterprise', 'Download Splunk Enterprise', 'Download Splunk Enterprise');
add('guide.docs.licenseManager', 'Configure a license manager', 'Configure a license manager', 'Configure a license manager');
add('guide.docs.indexerCluster', 'Deploy an indexer cluster', 'Deploy an indexer cluster', 'Deploy an indexer cluster');
add('guide.docs.clusterManager', 'Configure the manager node', 'Configure the manager node', 'Configure the manager node');
add('guide.docs.searchHeadCluster', 'Deploy a search head cluster', 'Deploy a search head cluster', 'Deploy a search head cluster');
add('guide.docs.deployer', 'Deployer requirements', 'Deployer requirements', 'Deployer requirements');
add('guide.docs.deploymentServer', 'Deployment server', 'Deployment server', 'Deployment server');
add('guide.docs.monitoringConsole', 'Monitoring Console host', 'Monitoring Console host', 'Monitoring Console host');
add('guide.docs.forwarders', 'Install Universal Forwarder', 'Install Universal Forwarder', 'Install Universal Forwarder');
add('guide.docs.networkPorts', 'Network components', 'Network components', 'Network components');
add('guide.docs.managementComponents', 'Management components', 'Management components', 'Management components');
add('guide.docs.systemRequirements', 'System requirements (Linux)', 'System requirements (Linux)', 'System requirements (Linux)');
add('guide.docs.sva', 'Splunk Validated Architectures', 'Splunk Validated Architectures', 'Splunk Validated Architectures');

// --- STEPS: install-splunk ---
add('steps.install-splunk.phase', 'STEP 2', 'PASSO 2', 'PASO 2');
add('steps.install-splunk.title', 'Download and install Splunk Enterprise', 'Transferir e instalar Splunk Enterprise', 'Descargar e instalar Splunk Enterprise');
add('steps.install-splunk.blocks.download-intro', 'Use the latest GA **.tgz** package from Splunk downloads. Multi-exec these steps on every Splunk Enterprise host in your profile (not forwarders).', 'Use o pacote GA **.tgz** mais recente dos downloads Splunk. Multi-exec estes passos em cada host Splunk Enterprise do perfil (não forwarders).', 'Use el paquete GA **.tgz** más reciente de las descargas Splunk. Multi-exec estos pasos en cada host Splunk Enterprise de su perfil (no forwarders).');
add('steps.install-splunk.blocks.download-extract', 'Download and extract (example — replace URL with your version from splunk.com):', 'Transferir e extrair (exemplo — substitua o URL pela sua versão em splunk.com):', 'Descargar y extraer (ejemplo — sustituya la URL por su versión en splunk.com):');
add('steps.install-splunk.blocks.ownership-warning', '**Before first start:** confirm `/opt/splunk` is owned by **{{OS_USER}}** (`sudo chown -R {{OS_USER}}:{{OS_USER}} /opt/splunk`). Splunk will refuse to run or create files as root. Re-check ownership after any `sudo tar` extraction.', '**Antes do primeiro arranque:** confirme que `/opt/splunk` pertence a **{{OS_USER}}** (`sudo chown -R {{OS_USER}}:{{OS_USER}} /opt/splunk`). Splunk recusa correr ou criar ficheiros como root. Reveja a propriedade após qualquer extração `sudo tar`.', '**Antes del primer arranque:** confirme que `/opt/splunk` pertenece a **{{OS_USER}}** (`sudo chown -R {{OS_USER}}:{{OS_USER}} /opt/splunk`). Splunk se negará a ejecutarse o crear archivos como root. Revise la propiedad tras cualquier extracción `sudo tar`.');
add('steps.install-splunk.blocks.first-start', 'First start and license acceptance:', 'Primeiro arranque e aceitação de licença:', 'Primer arranque y aceptación de licencia:');
add('steps.install-splunk.blocks.boot-start', 'Enable boot-start (systemd on RHEL 8+):', 'Ativar boot-start (systemd em RHEL 8+):', 'Activar boot-start (systemd en RHEL 8+):');
add('steps.install-splunk.blocks.ubuntu-boot', 'Ubuntu: `splunk enable boot-start` creates systemd unit on modern releases. Verify with `systemctl status Splunkd`.', 'Ubuntu: `splunk enable boot-start` cria unidade systemd em versões recentes. Verifique com `systemctl status Splunkd`.', 'Ubuntu: `splunk enable boot-start` crea unidad systemd en versiones recientes. Verifique con `systemctl status Splunkd`.');
add('steps.install-splunk.validations.status.label', 'Splunk running', 'Splunk em execução', 'Splunk en ejecución');
add('steps.install-splunk.validations.status.expect', '`/opt/splunk/bin/splunk status` reports splunkd is running.', '`/opt/splunk/bin/splunk status` indica que splunkd está em execução.', '`/opt/splunk/bin/splunk status` indica que splunkd está en ejecución.');
add('steps.install-splunk.validations.systemd.label', 'Boot-start enabled', 'Boot-start ativado', 'Boot-start activado');
add('steps.install-splunk.validations.systemd.expect', '`systemctl status Splunkd` shows active (running).', '`systemctl status Splunkd` mostra active (running).', '`systemctl status Splunkd` muestra active (running).');

// --- STEPS: license-manager, license-slaves, license-slave-single ---
add('steps.license-manager.phase', 'STEP 3', 'PASSO 3', 'PASO 3');
add('steps.license-manager.title', 'Configure License Manager', 'Configurar License Manager', 'Configurar License Manager');
add('steps.license-manager.blocks.intro', 'On the management host (or combined server for single-server). Never store production license files in public repos.', 'No host de management (ou servidor combinado para single-server). Nunca guarde ficheiros de licença de produção em repositórios públicos.', 'En el host de management (o servidor combinado para single-server). Nunca almacene archivos de licencia de producción en repos públicos.');
add('steps.license-manager.blocks.add-license', 'Add license and set server name:', 'Adicionar licença e definir server name:', 'Añadir licencia y definir server name:');
add('steps.license-manager.blocks.web-https', 'Via Splunk Web: **Settings → Server settings → General settings** — enable HTTPS. **Settings → Licensing** — verify license.', 'Via Splunk Web: **Settings → Server settings → General settings** — ativar HTTPS. **Settings → Licensing** — verificar licença.', 'Via Splunk Web: **Settings → Server settings → General settings** — activar HTTPS. **Settings → Licensing** — verificar licencia.');
add('steps.license-manager.blocks.mc-roles', '**Settings → Monitoring Console → Settings → General Setup → Edit Server Roles** — enable License Manager and Deployment Server (when DS is colocated).', '**Settings → Monitoring Console → Settings → General Setup → Edit Server Roles** — ativar License Manager e Deployment Server (quando DS está colocalizado).', '**Settings → Monitoring Console → Settings → General Setup → Edit Server Roles** — activar License Manager y Deployment Server (cuando DS está colocalizado).');
add('steps.license-manager.validations.license.label', 'License installed', 'Licença instalada', 'Licencia instalada');
add('steps.license-manager.validations.license.expect', 'Splunk Web **Settings → Licensing** shows valid license.', 'Splunk Web **Settings → Licensing** mostra licença válida.', 'Splunk Web **Settings → Licensing** muestra licencia válida.');

add('steps.license-slaves.phase', 'STEP 3b', 'PASSO 3b', 'PASO 3b');
add('steps.license-slaves.title', 'Register license slaves', 'Registar license slaves', 'Registrar license slaves');
add('steps.license-slaves.blocks.register', 'On every non-LM Splunk instance:', 'Em cada instância Splunk que não seja LM:', 'En cada instancia Splunk que no sea LM:');
add('steps.license-slaves.blocks.verify', 'Verify on License Manager:', 'Verificar no License Manager:', 'Verificar en License Manager:');
add('steps.license-slaves.validations.slaves.label', 'Slaves registered', 'Slaves registados', 'Slaves registrados');
add('steps.license-slaves.validations.slaves.expect', '`splunk list licenser-slaves` lists all peer instances.', '`splunk list licenser-slaves` lista todas as instâncias peer.', '`splunk list licenser-slaves` lista todas las instancias peer.');

add('steps.license-slave-single.phase', 'STEP 3b', 'PASSO 3b', 'PASO 3b');
add('steps.license-slave-single.title', 'License on single server', 'Licença em servidor único', 'Licencia en servidor único');
add('steps.license-slave-single.blocks.intro', 'Single-server: license is local on the combined instance. Skip slave registration.', 'Single-server: licença local na instância combinada. Ignore registo de slaves.', 'Single-server: licencia local en la instancia combinada. Omita registro de slaves.');
add('steps.license-slave-single.validations.local.label', 'Local license', 'Licença local', 'Licencia local');
add('steps.license-slave-single.validations.local.expect', 'License visible on combined instance; no slave registration required.', 'Licença visível na instância combinada; registo de slaves não necessário.', 'Licencia visible en instancia combinada; registro de slaves no requerido.');

// --- STEPS: single-roles, nc-indexer, nc-search-head ---
add('steps.single-roles.phase', 'STEP 4', 'PASSO 4', 'PASO 4');
add('steps.single-roles.title', 'Configure combined instance roles', 'Configurar funções da instância combinada', 'Configurar roles de instancia combinada');
add('steps.single-roles.blocks.configure', 'On combined server:', 'No servidor combinado:', 'En el servidor combinado:');
add('steps.single-roles.blocks.mc-roles', 'MC roles: License Manager, Deployment Server, Monitoring Console, Indexer, Search Head (all on one instance for lab).', 'Funções MC: License Manager, Deployment Server, Monitoring Console, Indexer, Search Head (tudo numa instância para laboratório).', 'Roles MC: License Manager, Deployment Server, Monitoring Console, Indexer, Search Head (todo en una instancia para laboratorio).');
add('steps.single-roles.validations.listen.label', 'Receiving enabled', 'Receiving ativado', 'Receiving activado');
add('steps.single-roles.validations.listen.expect', 'Indexer listening on TCP/9997.', 'Indexer à escuta em TCP/9997.', 'Indexer escuchando en TCP/9997.');

add('steps.nc-indexer.phase', 'STEP 4', 'PASSO 4', 'PASO 4');
add('steps.nc-indexer.title', 'Configure standalone indexer', 'Configurar indexer standalone', 'Configurar indexer standalone');
add('steps.nc-indexer.blocks.configure', 'On indexer {{IDX1_HOST}} ({{IDX1_IP}}):', 'No indexer {{IDX1_HOST}} ({{IDX1_IP}}):', 'En el indexer {{IDX1_HOST}} ({{IDX1_IP}}):');
add('steps.nc-indexer.blocks.mc-role', 'MC role: Settings → Monitoring Console → Edit Server Roles → Indexer.', 'Função MC: Settings → Monitoring Console → Edit Server Roles → Indexer.', 'Rol MC: Settings → Monitoring Console → Edit Server Roles → Indexer.');
add('steps.nc-indexer.validations.listen.label', 'Receiving enabled', 'Receiving ativado', 'Receiving activado');
add('steps.nc-indexer.validations.listen.expect', '`splunk enable listen 9997` applied and splunkd restarted.', '`splunk enable listen 9997` aplicado e splunkd reiniciado.', '`splunk enable listen 9997` aplicado y splunkd reiniciado.');

add('steps.nc-search-head.phase', 'STEP 5', 'PASSO 5', 'PASO 5');
add('steps.nc-search-head.title', 'Configure search head', 'Configurar search head', 'Configurar search head');
add('steps.nc-search-head.blocks.configure', 'On search head {{SH1_HOST}}:', 'No search head {{SH1_HOST}}:', 'En el search head {{SH1_HOST}}:');
add('steps.nc-search-head.blocks.https-mc', 'Enable HTTPS on Splunk Web. MC role: Search Head.', 'Ativar HTTPS no Splunk Web. Função MC: Search Head.', 'Activar HTTPS en Splunk Web. Rol MC: Search Head.');
add('steps.nc-search-head.validations.search-server.label', 'Distributed search peer', 'Peer de pesquisa distribuída', 'Peer de búsqueda distribuida');
add('steps.nc-search-head.validations.search-server.expect', 'Search head can search indexer {{IDX1_IP}}.', 'Search head consegue pesquisar no indexer {{IDX1_IP}}.', 'Search head puede buscar en indexer {{IDX1_IP}}.');

// --- STEPS: ic-manager, ic-peers, ic-searchhead, disable-indexing ---
add('steps.ic-manager.phase', 'STEP 4', 'PASSO 4', 'PASO 4');
add('steps.ic-manager.title', 'Configure Cluster Manager', 'Configurar Cluster Manager', 'Configurar Cluster Manager');
add('steps.ic-manager.blocks.intro', 'Splunk 9.x+ uses **Cluster Manager** (`-mode manager`). Legacy docs may say "cluster master".', 'Splunk 9.x+ usa **Cluster Manager** (`-mode manager`). Documentação antiga pode referir "cluster master".', 'Splunk 9.x+ usa **Cluster Manager** (`-mode manager`). La documentación antigua puede decir "cluster master".');
add('steps.ic-manager.blocks.configure', 'On Cluster Manager {{CM_HOST}} ({{CM_IP}}):', 'No Cluster Manager {{CM_HOST}} ({{CM_IP}}):', 'En Cluster Manager {{CM_HOST}} ({{CM_IP}}):');
add('steps.ic-manager.blocks.mc-roles', 'MC role: Cluster Manager. Enable HTTPS. Never colocate CM with Deployment Server.', 'Função MC: Cluster Manager. Ativar HTTPS. Nunca colocalizar CM com Deployment Server.', 'Rol MC: Cluster Manager. Activar HTTPS. Nunca colocalizar CM con Deployment Server.');
add('steps.ic-manager.blocks.handoff-rf-sf', '**Planner handoff:** use the RF and SF from your topology plan (e.g. RF=3, SF=2 for a 3-peer lab). `-replication_factor` must be ≤ indexer count; `-search_factor` must be ≤ RF. Match `-secret` to {{CLUSTER_SECRET}} on all cluster members.', '**Handoff do planejador:** use RF e SF do seu plano de topologia (ex.: RF=3, SF=2 para laboratório 3 peers). `-replication_factor` deve ser ≤ número de indexers; `-search_factor` deve ser ≤ RF. Igualar `-secret` a {{CLUSTER_SECRET}} em todos os membros do cluster.', '**Transferencia del planificador:** use RF y SF de su plan de topología (p. ej. RF=3, SF=2 para laboratorio de 3 peers). `-replication_factor` debe ser ≤ número de indexers; `-search_factor` debe ser ≤ RF. Igualar `-secret` a {{CLUSTER_SECRET}} en todos los miembros del cluster.');
add('steps.ic-manager.validations.cluster-config.label', 'Manager configured', 'Manager configurado', 'Manager configurado');
add('steps.ic-manager.validations.cluster-config.expect', '`splunk show cluster-status` reports manager ready (after peers join).', '`splunk show cluster-status` indica manager ready (após peers entrarem).', '`splunk show cluster-status` indica manager ready (tras unir peers).');

add('steps.ic-peers.phase', 'STEP 5', 'PASSO 5', 'PASO 5');
add('steps.ic-peers.title', 'Configure indexer cluster peers', 'Configurar peers do indexer cluster', 'Configurar peers del indexer cluster');
add('steps.ic-peers.blocks.configure', 'Multi-exec on all indexers ({{IDX1_IP}}, {{IDX2_IP}}, {{IDX3_IP}}):', 'Multi-exec em todos os indexers ({{IDX1_IP}}, {{IDX2_IP}}, {{IDX3_IP}}):', 'Multi-exec en todos los indexers ({{IDX1_IP}}, {{IDX2_IP}}, {{IDX3_IP}}):');
add('steps.ic-peers.blocks.verify', 'Verify on Cluster Manager:', 'Verificar no Cluster Manager:', 'Verificar en Cluster Manager:');
add('steps.ic-peers.validations.peers.label', 'All peers up', 'Todos os peers up', 'Todos los peers up');
add('steps.ic-peers.validations.peers.expect', '`show cluster-status` lists all peers Up.', '`show cluster-status` lista todos os peers Up.', '`show cluster-status` lista todos los peers Up.');

add('steps.ic-searchhead.phase', 'STEP 6', 'PASSO 6', 'PASO 6');
add('steps.ic-searchhead.title', 'Configure search head for indexer cluster', 'Configurar search head para indexer cluster', 'Configurar search head para indexer cluster');
add('steps.ic-searchhead.blocks.configure', 'On search head {{SH1_HOST}}:', 'No search head {{SH1_HOST}}:', 'En el search head {{SH1_HOST}}:');
add('steps.ic-searchhead.validations.sh-cluster.label', 'SH cluster mode', 'Modo cluster SH', 'Modo cluster SH');
add('steps.ic-searchhead.validations.sh-cluster.expect', 'Search head registered with manager_uri {{CM_IP}}.', 'Search head registado com manager_uri {{CM_IP}}.', 'Search head registrado con manager_uri {{CM_IP}}.');

add('steps.disable-indexing-non-indexers.phase', 'STEP 7', 'PASSO 7', 'PASO 7');
add('steps.disable-indexing-non-indexers.title', 'Disable local indexing on non-indexer roles', 'Desativar indexação local em funções não-indexer', 'Desactivar indexación local en roles no-indexer');
add('steps.disable-indexing-non-indexers.blocks.create-outputs', 'Create /opt/splunk/etc/system/local/outputs.conf on CM, SH, mgmt, deployer, DS:', 'Criar /opt/splunk/etc/system/local/outputs.conf em CM, SH, mgmt, deployer, DS:', 'Crear /opt/splunk/etc/system/local/outputs.conf en CM, SH, mgmt, deployer, DS:');
add('steps.disable-indexing-non-indexers.blocks.indexAndForward', 'Paste into outputs.conf:', 'Colar em outputs.conf:', 'Pegar en outputs.conf:');
add('steps.disable-indexing-non-indexers.blocks.tcpout', 'Paste into outputs.conf:', 'Colar em outputs.conf:', 'Pegar en outputs.conf:');
add('steps.disable-indexing-non-indexers.blocks.tcpout-group', 'Paste into outputs.conf:', 'Colar em outputs.conf:', 'Pegar en outputs.conf:');
add('steps.disable-indexing-non-indexers.blocks.restart', 'Restart Splunk:', 'Reiniciar Splunk:', 'Reiniciar Splunk:');
add('steps.disable-indexing-non-indexers.validations.outputs.label', 'Forwarding configured', 'Forwarding configurado', 'Forwarding configurado');
add('steps.disable-indexing-non-indexers.validations.outputs.expect', 'Non-indexer nodes forward internal logs to {{IDX_RECEIVING_LIST}}.', 'Nós não-indexer encaminham logs internos para {{IDX_RECEIVING_LIST}}.', 'Nodos no-indexer reenvían logs internos a {{IDX_RECEIVING_LIST}}.');

// --- STEPS: shc-deployer, shc-dedicated-ds, shc-members ---
add('steps.shc-deployer.phase', 'STEP 6', 'PASSO 6', 'PASO 6');
add('steps.shc-deployer.title', 'Configure SHC Deployer', 'Configurar SHC Deployer', 'Configurar SHC Deployer');
add('steps.shc-deployer.blocks.configure', 'On deployer {{DEPLOYER_HOST}}:', 'No deployer {{DEPLOYER_HOST}}:', 'En deployer {{DEPLOYER_HOST}}:');
add('steps.shc-deployer.validations.deployer.label', 'Deployer configured', 'Deployer configurado', 'Deployer configurado');
add('steps.shc-deployer.validations.deployer.expect', 'Deployer connected to indexer cluster manager.', 'Deployer ligado ao manager do indexer cluster.', 'Deployer conectado al manager del indexer cluster.');

add('steps.shc-dedicated-ds.phase', 'STEP 6b', 'PASSO 6b', 'PASO 6b');
add('steps.shc-dedicated-ds.title', 'Configure dedicated Deployment Server', 'Configurar Deployment Server dedicado', 'Configurar Deployment Server dedicado');
add('steps.shc-dedicated-ds.blocks.configure', 'On DS {{DS_HOST}} — dedicated (not colocated with CM):', 'No DS {{DS_HOST}} — dedicado (não colocalizado com CM):', 'En DS {{DS_HOST}} — dedicado (no colocalizado con CM):');
add('steps.shc-dedicated-ds.blocks.mc-role', 'MC role: Deployment Server.', 'Função MC: Deployment Server.', 'Rol MC: Deployment Server.');
add('steps.shc-dedicated-ds.validations.ds.label', 'DS running', 'DS em execução', 'DS en ejecución');
add('steps.shc-dedicated-ds.validations.ds.expect', 'Deployment Server reachable on {{DS_IP}}:8089.', 'Deployment Server acessível em {{DS_IP}}:8089.', 'Deployment Server accesible en {{DS_IP}}:8089.');

add('steps.shc-members.phase', 'STEP 7', 'PASSO 7', 'PASO 7');
add('steps.shc-members.title', 'Initialize search head cluster members', 'Inicializar membros do search head cluster', 'Inicializar miembros del search head cluster');
add('steps.shc-members.blocks.intro', 'Minimum 3 SHC members. Captain election requires odd member count (3, 5, …).', 'Mínimo 3 membros SHC. Eleição de captain requer número ímpar de membros (3, 5, …).', 'Mínimo 3 miembros SHC. La elección de captain requiere número impar de miembros (3, 5, …).');
add('steps.shc-members.blocks.init-first', 'On first member ({{SH1_HOST}}) — initialize cluster:', 'No primeiro membro ({{SH1_HOST}}) — inicializar cluster:', 'En el primer miembro ({{SH1_HOST}}) — inicializar cluster:');
add('steps.shc-members.blocks.join-members', 'On members 2 and 3 — join cluster:', 'Nos membros 2 e 3 — juntar ao cluster:', 'En miembros 2 y 3 — unirse al cluster:');
add('steps.shc-members.blocks.elect-captain', 'Elect captain (on any member):', 'Eleger captain (em qualquer membro):', 'Elegir captain (en cualquier miembro):');
add('steps.shc-members.validations.members.label', 'SHC members up', 'Membros SHC up', 'Miembros SHC up');
add('steps.shc-members.validations.members.expect', '`splunk list shcluster-members` shows 3 members with one captain.', '`splunk list shcluster-members` mostra 3 membros com um captain.', '`splunk list shcluster-members` muestra 3 miembros con un captain.');

// --- STEPS: monitoring-console, monitoring-console-single ---
add('steps.monitoring-console.phase', 'STEP 8', 'PASSO 8', 'PASO 8');
add('steps.monitoring-console.title', 'Configure Monitoring Console (distributed)', 'Configurar Monitoring Console (distribuído)', 'Configurar Monitoring Console (distribuido)');
add('steps.monitoring-console.blocks.add-servers', 'On management host — add distributed instances:', 'No host de management — adicionar instâncias distribuídas:', 'En host de management — añadir instancias distribuidas:');
add('steps.monitoring-console.blocks.distributed-mode', '**Settings → Monitoring Console → General Setup** — change mode from Standalone to **Distributed**. Assign server roles on each remote instance.', '**Settings → Monitoring Console → General Setup** — alterar modo de Standalone para **Distributed**. Atribuir funções de servidor em cada instância remota.', '**Settings → Monitoring Console → General Setup** — cambiar modo de Standalone a **Distributed**. Asignar roles de servidor en cada instancia remota.');
add('steps.monitoring-console.validations.mc.label', 'MC distributed', 'MC distribuído', 'MC distribuido');
add('steps.monitoring-console.validations.mc.expect', 'Monitoring Console shows all remote instances and roles.', 'Monitoring Console mostra todas as instâncias remotas e funções.', 'Monitoring Console muestra todas las instancias remotas y roles.');

add('steps.monitoring-console-single.phase', 'STEP 8', 'PASSO 8', 'PASO 8');
add('steps.monitoring-console-single.title', 'Monitoring Console (single server)', 'Monitoring Console (servidor único)', 'Monitoring Console (servidor único)');
add('steps.monitoring-console-single.blocks.intro', 'Single server: MC runs in standalone mode on the combined instance.', 'Servidor único: MC corre em modo standalone na instância combinada.', 'Servidor único: MC se ejecuta en modo standalone en la instancia combinada.');
add('steps.monitoring-console-single.validations.standalone.label', 'MC standalone', 'MC standalone', 'MC standalone');
add('steps.monitoring-console-single.validations.standalone.expect', 'Monitoring Console accessible on combined instance.', 'Monitoring Console acessível na instância combinada.', 'Monitoring Console accesible en instancia combinada.');

// --- STEPS: indexes-cluster, indexes-standalone ---
add('steps.indexes-cluster.phase', 'STEP 9', 'PASSO 9', 'PASO 9');
add('steps.indexes-cluster.title', 'Create indexes (indexer cluster)', 'Criar indexes (indexer cluster)', 'Crear indexes (indexer cluster)');
add('steps.indexes-cluster.blocks.mkdir', 'On Cluster Manager — create cluster bundle app directory:', 'No Cluster Manager — criar diretório da app cluster bundle:', 'En Cluster Manager — crear directorio de app cluster bundle:');
add('steps.indexes-cluster.blocks.open-indexes', 'Open indexes.conf in the cluster bundle:', 'Abrir indexes.conf no cluster bundle:', 'Abrir indexes.conf en el cluster bundle:');
add('steps.indexes-cluster.blocks.paste-index', 'Paste into indexes.conf:', 'Colar em indexes.conf:', 'Pegar en indexes.conf:');
add('steps.indexes-cluster.blocks.apply-bundle', 'Apply and verify cluster bundle:', 'Aplicar e verificar cluster bundle:', 'Aplicar y verificar cluster bundle:');
add('steps.indexes-cluster.validations.bundle.label', 'Bundle applied', 'Bundle aplicado', 'Bundle aplicado');
add('steps.indexes-cluster.validations.bundle.expect', '`show cluster-bundle-status` shows successful apply on all peers.', '`show cluster-bundle-status` mostra apply bem-sucedido em todos os peers.', '`show cluster-bundle-status` muestra apply exitoso en todos los peers.');

add('steps.indexes-standalone.phase', 'STEP 9', 'PASSO 9', 'PASO 9');
add('steps.indexes-standalone.title', 'Create indexes (standalone / non-cluster)', 'Criar indexes (standalone / sem cluster)', 'Crear indexes (standalone / sin cluster)');
add('steps.indexes-standalone.blocks.open-indexes', 'On indexer (or combined server):', 'No indexer (ou servidor combinado):', 'En indexer (o servidor combinado):');
add('steps.indexes-standalone.blocks.paste-index', 'Paste into indexes.conf:', 'Colar em indexes.conf:', 'Pegar en indexes.conf:');
add('steps.indexes-standalone.blocks.restart', 'Restart Splunk:', 'Reiniciar Splunk:', 'Reiniciar Splunk:');
add('steps.indexes-standalone.validations.index.label', 'Index created', 'Index criado', 'Index creado');
add('steps.indexes-standalone.validations.index.expect', 'Index `os` visible in Splunk Web or via CLI.', 'Index `os` visível no Splunk Web ou via CLI.', 'Index `os` visible en Splunk Web o vía CLI.');

// --- STEPS: tls-web, hec-tokens, validation ---
add('steps.tls-web.phase', 'STEP 10', 'PASSO 10', 'PASO 10');
add('steps.tls-web.title', 'Enable HTTPS on Splunk Web (search tier)', 'Ativar HTTPS no Splunk Web (search tier)', 'Activar HTTPS en Splunk Web (search tier)');
add('steps.tls-web.blocks.intro', 'Production: terminate TLS on Splunk Web (TCP/8000) with a trusted certificate. Lab: self-signed certs are acceptable for testing only.', 'Produção: terminar TLS no Splunk Web (TCP/8000) com certificado confiável. Laboratório: certificados self-signed aceitáveis apenas para testes.', 'Producción: terminar TLS en Splunk Web (TCP/8000) con certificado de confianza. Laboratorio: certificados self-signed aceptables solo para pruebas.');
add('steps.tls-web.blocks.self-signed', 'Generate self-signed cert (lab only):', 'Gerar certificado self-signed (apenas laboratório):', 'Generar certificado self-signed (solo laboratorio):');
add('steps.tls-web.blocks.open-server-conf', 'Enable Splunk Web SSL in server.conf:', 'Ativar SSL Splunk Web em server.conf:', 'Activar SSL Splunk Web en server.conf:');
add('steps.tls-web.blocks.paste-ssl', 'Paste into server.conf:', 'Colar em server.conf:', 'Pegar en server.conf:');
add('steps.tls-web.blocks.restart', 'Restart Splunk:', 'Reiniciar Splunk:', 'Reiniciar Splunk:');
add('steps.tls-web.blocks.production-warning', 'Production: use CA-signed certificates, restrict cipher suites, and store `sslPassword` in a secrets manager — not in plain text in server.conf.', 'Produção: use certificados assinados por CA, restrinja cipher suites e guarde `sslPassword` num secrets manager — não em texto simples em server.conf.', 'Producción: use certificados firmados por CA, restrinja cipher suites y almacene `sslPassword` en un secrets manager — no en texto plano en server.conf.');
add('steps.tls-web.validations.https.label', 'HTTPS enabled', 'HTTPS ativado', 'HTTPS activado');
add('steps.tls-web.validations.https.expect', 'Splunk Web loads on https://host:8000.', 'Splunk Web carrega em https://host:8000.', 'Splunk Web carga en https://host:8000.');

add('steps.hec-tokens.phase', 'STEP 11', 'PASSO 11', 'PASO 11');
add('steps.hec-tokens.title', 'Configure HTTP Event Collector (HEC)', 'Configurar HTTP Event Collector (HEC)', 'Configurar HTTP Event Collector (HEC)');
add('steps.hec-tokens.blocks.intro', 'HEC (TCP/8088) is the recommended ingest path for applications. Create tokens per source; use TLS in production.', 'HEC (TCP/8088) é o caminho de ingest recomendado para aplicações. Crie tokens por origem; use TLS em produção.', 'HEC (TCP/8088) es la ruta de ingest recomendada para aplicaciones. Cree tokens por origen; use TLS en producción.');
add('steps.hec-tokens.blocks.open-inputs', 'Enable HEC via Settings → Data Inputs → HTTP Event Collector, or edit inputs.conf:', 'Ativar HEC via Settings → Data Inputs → HTTP Event Collector, ou editar inputs.conf:', 'Activar HEC vía Settings → Data Inputs → HTTP Event Collector, o editar inputs.conf:');
add('steps.hec-tokens.blocks.paste-http', 'Paste into inputs.conf:', 'Colar em inputs.conf:', 'Pegar en inputs.conf:');
add('steps.hec-tokens.blocks.paste-token', 'Paste token stanza into inputs.conf:', 'Colar stanza de token em inputs.conf:', 'Pegar stanza de token en inputs.conf:');
add('steps.hec-tokens.blocks.restart', 'Restart Splunk:', 'Reiniciar Splunk:', 'Reiniciar Splunk:');
add('steps.hec-tokens.blocks.firewall', 'Open TCP/8088 in your firewall (`firewall-cmd` or cloud SG). Verify with `curl -k https://{{IDX1_HOST}}:8088/services/collector/health`.', 'Abra TCP/8088 na firewall (`firewall-cmd` ou cloud SG). Verifique com `curl -k https://{{IDX1_HOST}}:8088/services/collector/health`.', 'Abra TCP/8088 en el firewall (`firewall-cmd` o cloud SG). Verifique con `curl -k https://{{IDX1_HOST}}:8088/services/collector/health`.');
add('steps.hec-tokens.blocks.lab-warning', 'Lab: `enableSSL = 0` is possible but not recommended. Production: enable SSL, rotate tokens, and scope indexes/sourcetypes per token.', 'Laboratório: `enableSSL = 0` é possível mas não recomendado. Produção: ative SSL, rode tokens e limite indexes/sourcetypes por token.', 'Laboratorio: `enableSSL = 0` es posible pero no recomendado. Producción: active SSL, rote tokens y limite indexes/sourcetypes por token.');
add('steps.hec-tokens.validations.hec.label', 'HEC health', 'Saúde HEC', 'Salud HEC');
add('steps.hec-tokens.validations.hec.expect', 'HEC health endpoint returns success.', 'Endpoint de saúde HEC devolve sucesso.', 'Endpoint de salud HEC devuelve éxito.');

add('steps.validation.phase', 'STEP 12', 'PASSO 12', 'PASO 12');
add('steps.validation.title', 'Validation and health check', 'Validação e verificação de saúde', 'Validación y comprobación de salud');
add('steps.validation.blocks.cli-checks', 'CLI checks:', 'Verificações CLI:', 'Comprobaciones CLI:');
add('steps.validation.blocks.mc-health', 'Splunk Web → **Settings → Monitoring Console → Health Check**. All checks should pass (hardware warnings may appear in undersized labs).', 'Splunk Web → **Settings → Monitoring Console → Health Check**. Todas as verificações devem passar (avisos de hardware podem aparecer em laboratórios subdimensionados).', 'Splunk Web → **Settings → Monitoring Console → Health Check**. Todas las comprobaciones deben pasar (avisos de hardware pueden aparecer en laboratorios subdimensionados).');
add('steps.validation.blocks.internal-forward', 'Confirm internal logs are forwarding from management/search tiers to indexers when indexing is disabled on those nodes.', 'Confirme que logs internos são encaminhados de tiers management/search para indexers quando a indexação está desativada nesses nós.', 'Confirme que los logs internos se reenvían desde tiers management/search a indexers cuando la indexación está desactivada en esos nodos.');
add('steps.validation.validations.health.label', 'Health Check', 'Health Check', 'Health Check');
add('steps.validation.validations.health.expect', 'Monitoring Console Health Check shows no critical failures.', 'Monitoring Console Health Check sem falhas críticas.', 'Monitoring Console Health Check sin fallos críticos.');

// --- STEPS: uf-install, uf-ds-poll, indexer-discovery ---
add('steps.uf-install.phase', 'APPENDIX A', 'APÊNDICE A', 'APÉNDICE A');
add('steps.uf-install.title', 'Install Universal Forwarder', 'Instalar Universal Forwarder', 'Instalar Universal Forwarder');
add('steps.uf-install.blocks.intro', 'Optional appendix. Install UF on forwarder hosts only — not on Splunk Enterprise servers.', 'Apêndice opcional. Instale UF apenas em hosts forwarder — não em servidores Splunk Enterprise.', 'Apéndice opcional. Instale UF solo en hosts forwarder — no en servidores Splunk Enterprise.');
add('steps.uf-install.blocks.install', 'On each UF host:', 'Em cada host UF:', 'En cada host UF:');
add('steps.uf-install.validations.uf.label', 'UF running', 'UF em execução', 'UF en ejecución');
add('steps.uf-install.validations.uf.expect', '`splunkforwarder/bin/splunk status` reports running.', '`splunkforwarder/bin/splunk status` indica em execução.', '`splunkforwarder/bin/splunk status` indica en ejecución.');

add('steps.uf-ds-poll.phase', 'APPENDIX B', 'APÊNDICE B', 'APÉNDICE B');
add('steps.uf-ds-poll.title', 'Forwarders poll Deployment Server', 'Forwarders consultam Deployment Server', 'Forwarders consultan Deployment Server');
add('steps.uf-ds-poll.blocks.configure', 'Point UF to DS (or mgmt if DS colocated):', 'Apontar UF para DS (ou mgmt se DS colocalizado):', 'Apuntar UF a DS (o mgmt si DS colocalizado):');
add('steps.uf-ds-poll.blocks.server-class', 'On DS: **Settings → Forwarder Management** — create server classes and assign forwarders. Enable forwarder monitoring in MC.', 'No DS: **Settings → Forwarder Management** — criar server classes e atribuir forwarders. Ativar monitorização de forwarders no MC.', 'En DS: **Settings → Forwarder Management** — crear server classes y asignar forwarders. Activar monitorización de forwarders en MC.');
add('steps.uf-ds-poll.validations.poll.label', 'Deploy poll', 'Deploy poll', 'Deploy poll');
add('steps.uf-ds-poll.validations.poll.expect', 'UF appears in Deployment Server client list.', 'UF aparece na lista de clientes do Deployment Server.', 'UF aparece en la lista de clientes del Deployment Server.');

add('steps.indexer-discovery.phase', 'APPENDIX C', 'APÊNDICE C', 'APÉNDICE C');
add('steps.indexer-discovery.title', 'Indexer discovery for forwarder outputs', 'Indexer discovery para outputs de forwarder', 'Indexer discovery para outputs de forwarder');
add('steps.indexer-discovery.blocks.open-server-conf', 'On Cluster Manager — enable indexer discovery:', 'No Cluster Manager — ativar indexer discovery:', 'En Cluster Manager — activar indexer discovery:');
add('steps.indexer-discovery.blocks.paste-discovery', 'Paste into server.conf:', 'Colar em server.conf:', 'Pegar en server.conf:');
add('steps.indexer-discovery.blocks.restart', 'Restart Splunk:', 'Reiniciar Splunk:', 'Reiniciar Splunk:');
add('steps.indexer-discovery.blocks.tcpout-stanza', 'Deployment app outputs.conf — paste tcpout stanza:', 'App de deployment outputs.conf — colar stanza tcpout:', 'App de deployment outputs.conf — pegar stanza tcpout:');
add('steps.indexer-discovery.blocks.idxc-stanza', 'Deployment app outputs.conf — paste indexer discovery stanza:', 'App de deployment outputs.conf — colar stanza indexer discovery:', 'App de deployment outputs.conf — pegar stanza indexer discovery:');
add('steps.indexer-discovery.validations.discovery.label', 'Indexer discovery', 'Indexer discovery', 'Indexer discovery');
add('steps.indexer-discovery.validations.discovery.expect', 'Forwarders receive indexer list from Cluster Manager.', 'Forwarders recebem lista de indexers do Cluster Manager.', 'Forwarders reciben lista de indexers del Cluster Manager.');

// --- PLANNER ---
add('planner.title', 'Splunk On-Prem Topology Planner', 'Planejador de topologia Splunk On-Prem', 'Planificador de topología Splunk On-Prem');
add('planner.subtitle', 'SVA topology, storage, hardware (10.4), firewall ports, management colocation · Linux deployment guide', 'Topologia SVA, armazenamento, hardware (10.4), portas firewall, colocalização management · Guia de implantação Linux', 'Topología SVA, almacenamiento, hardware (10.4), puertos firewall, colocalización management · Guía de implementación Linux');
add('planner.panels.workload', '1. Workload', '1. Carga de trabalho', '1. Carga de trabajo');
add('planner.panels.retention', '2. Data retention', '2. Retenção de dados', '2. Retención de datos');
add('planner.panels.premium', '3. Premium apps', '3. Apps premium', '3. Apps premium');
add('planner.panels.topology', '4. Topology preferences', '4. Preferências de topologia', '4. Preferencias de topología');
add('planner.panels.management', '5. Management node', '5. Nó de management', '5. Nodo de management');
add('planner.panels.environment', '6. Environment', '6. Ambiente', '6. Entorno');

add('planner.field.useEpsInput', 'Calculate ingest from EPS', 'Calcular ingest a partir de EPS', 'Calcular ingest a partir de EPS');
add('planner.field.dailyIngestGb', 'Daily ingest (GB/day)', 'Ingest diário (GB/dia)', 'Ingest diario (GB/día)');
add('planner.field.eventsPerSecond', 'Events per second', 'Eventos por segundo', 'Eventos por segundo');
add('planner.field.avgEventBytes', 'Average event size (bytes)', 'Tamanho médio do evento (bytes)', 'Tamaño medio del evento (bytes)');
add('planner.field.utilizationPercent', 'Utilization (%)', 'Utilização (%)', 'Utilización (%)');
add('planner.field.utilizationHint', 'Recommended: 60–70%', 'Recomendado: 60–70%', 'Recomendado: 60–70%');
add('planner.field.epsComputedGb', 'Computed ingest: {value} GB/day', 'Ingest calculado: {value} GB/dia', 'Ingest calculado: {value} GB/día');
add('planner.field.epsFormula', 'GB/day = ((EPS × avg bytes × 3600 × 24) / 1024³) × (Utilization %)', 'GB/dia = ((EPS × bytes médios × 3600 × 24) / 1024³) × (Utilização %)', 'GB/día = ((EPS × bytes medios × 3600 × 24) / 1024³) × (Utilización %)');
add('planner.field.concurrentUsers', 'Expected concurrent users', 'Utilizadores concorrentes esperados', 'Usuarios concurrentes esperados');
add('planner.field.peakConcurrentSearches', 'Peak concurrent searches (optional)', 'Pesquisas concorrentes máximas (opcional)', 'Búsquedas concurrentes máximas (opcional)');
add('planner.field.hotWarm', 'Hot / warm', 'Hot / warm', 'Hot / warm');
add('planner.field.cold', 'Cold', 'Cold', 'Cold');
add('planner.field.frozen', 'Frozen / archive', 'Frozen / archive', 'Frozen / archive');
add('planner.field.enterpriseSecurity', 'Enterprise Security', 'Enterprise Security', 'Enterprise Security');
add('planner.field.itsi', 'IT Service Intelligence', 'IT Service Intelligence', 'IT Service Intelligence');
add('planner.field.premiumWarn', 'ES and ITSI require separate search heads.', 'ES e ITSI requerem search heads separados.', 'ES e ITSI requieren search heads separados.');
add('planner.field.singleServerDeployment', 'Single Server Deployment (S1) — combined indexer and search', 'Single Server Deployment (S1) — indexer e search combinados', 'Single Server Deployment (S1) — indexer y search combinados');
add('planner.field.inferredPrefixHint', 'Indexing tier prefix is chosen automatically from ingest, indexer count, and cluster settings.', 'O prefixo do indexing tier é escolhido automaticamente a partir de ingest, número de indexers e definições de cluster.', 'El prefijo del indexing tier se elige automáticamente según ingest, número de indexers y ajustes de cluster.');
add('planner.field.inferredPrefixResult', 'Auto indexing tier: {prefixLabel}', 'Indexing tier automático: {prefixLabel}', 'Indexing tier automático: {prefixLabel}');
add('planner.field.autoClusterEstimation', 'Automatic configuration', 'Configuração automática', 'Configuración automática');
add('planner.field.clusterAutoHint', 'Max volume per index: {maxVolumePerIndexGb} GB/day.', 'Volume máximo por index: {maxVolumePerIndexGb} GB/dia.', 'Volumen máximo por index: {maxVolumePerIndexGb} GB/día.');
add('planner.field.suggestedIndexers', 'Suggested indexers: {indexers}', 'Indexers sugeridos: {indexers}', 'Indexers sugeridos: {indexers}');
add('planner.field.suggestedSearchHeads', 'Suggested search heads: {searchHeads}', 'Search heads sugeridos: {searchHeads}', 'Search heads sugeridos: {searchHeads}');
add('planner.field.maxVolumePerIndexGb', 'Max volume per indexer (GB/day)', 'Volume máximo por indexer (GB/dia)', 'Volumen máximo por indexer (GB/día)');
add('planner.field.manualIndexerCount', 'Number of indexers (max {max})', 'Número de indexers (máx. {max})', 'Número de indexers (máx. {max})');
add('planner.field.searchHeadCount', 'Search heads (quantity)', 'Search heads (quantidade)', 'Search heads (cantidad)');
add('planner.field.searchHeadCluster', 'Search head cluster (SHC, min {min} members)', 'Search head cluster (SHC, mín. {min} membros)', 'Search head cluster (SHC, mín. {min} miembros)');
add('planner.field.searchHeadAutoHint', 'Auto from ingest + users', 'Automático a partir de ingest + utilizadores', 'Automático según ingest + usuarios');
add('planner.field.replicationFactor', 'Replication factor (RF)', 'Replication factor (RF)', 'Replication factor (RF)');
add('planner.field.searchFactor', 'Search factor (SF)', 'Search factor (SF)', 'Search factor (SF)');
add('planner.field.rfHint', 'RF ≤ indexer count', 'RF ≤ número de indexers', 'RF ≤ número de indexers');
add('planner.field.sfHint', 'SF ≤ RF', 'SF ≤ RF', 'SF ≤ RF');
add('planner.field.managementManualConfig', 'Manual configuration', 'Configuração manual', 'Configuración manual');
add('planner.field.forwarderClientCount', 'Forwarders / deployment clients', 'Forwarders / clientes de deployment', 'Forwarders / clientes de deployment');
add('planner.field.managementAutoSummary', 'Auto: CM and Deployer dedicated when applicable; LM/MC/DS may colocate if rules allow.', 'Auto: CM e Deployer dedicados quando aplicável; LM/MC/DS podem colocalizar se as regras permitirem.', 'Auto: CM y Deployer dedicados cuando aplique; LM/MC/DS pueden colocalizar si las reglas lo permiten.');
add('planner.field.dedicateDeploymentServer', 'Dedicated Deployment Server (DS)', 'Deployment Server (DS) dedicado', 'Deployment Server (DS) dedicado');
add('planner.field.colocateClusterManager', 'Colocate Indexer cluster manager node (CM)', 'Colocalizar nó Cluster Manager (CM)', 'Colocalizar nodo Cluster Manager (CM)');
add('planner.field.colocateShcDeployer', 'Colocate Search head cluster deployer', 'Colocalizar deployer do search head cluster', 'Colocalizar deployer del search head cluster');
add('planner.field.dedicateLicenseManager', 'Dedicated License Manager (LM)', 'License Manager (LM) dedicado', 'License Manager (LM) dedicado');
add('planner.field.dedicateMonitoringConsole', 'Dedicated Monitoring Console (MC)', 'Monitoring Console (MC) dedicado', 'Monitoring Console (MC) dedicado');
add('planner.field.environment', 'Hosting', 'Alojamento', 'Alojamiento');
add('planner.field.environmentPhysical', 'Physical / bare metal', 'Físico / bare metal', 'Físico / bare metal');
add('planner.field.environmentVirtual', 'Virtualized', 'Virtualizado', 'Virtualizado');
add('planner.field.virtualizationOverheadPct', 'Virtualization overhead (%)', 'Sobrecarga de virtualização (%)', 'Sobrecarga de virtualización (%)');
add('planner.field.virtualizationOverheadHint', 'Infrastructure compensation for the virtualized indexer. Usually 10 to 15 percent.', 'Compensação de infraestrutura para o indexer virtualizado. Normalmente 10 a 15 por cento.', 'Compensación de infraestructura para el indexer virtualizado. Normalmente 10 a 15 por ciento.');
add('planner.field.clusterReplication', 'Cluster Replication', 'Replicação de cluster', 'Replicación de cluster');
add('planner.field.esShc', 'Enterprise Security Search Head Cluster', 'Search Head Cluster do Enterprise Security', 'Search Head Cluster de Enterprise Security');
add('planner.field.esShcMembers', 'ES SHC members (min 3)', 'Membros do SHC de ES (mín. 3)', 'Miembros del SHC de ES (mín. 3)');
add('planner.field.itsiShc', 'ITSI Search Head Cluster', 'Search Head Cluster do ITSI', 'Search Head Cluster de ITSI');
add('planner.field.itsiShcMembers', 'ITSI SHC members (min 3)', 'Membros do SHC de ITSI (mín. 3)', 'Miembros del SHC de ITSI (mín. 3)');
add('planner.units.days', 'days', 'dias', 'días');
add('planner.units.months', 'months', 'meses', 'meses');
add('planner.units.years', 'years', 'anos', 'años');

add('planner.results.title', 'Sizing results', 'Resultados de dimensionamento', 'Resultados de dimensionamiento');
add('planner.results.updated', 'Updated: SVA {svaCode}, {totalTb} TB total, {ingestNote}', 'Atualizado: SVA {svaCode}, {totalTb} TB total, {ingestNote}', 'Actualizado: SVA {svaCode}, {totalTb} TB total, {ingestNote}');
add('planner.results.topology', 'Topology', 'Topologia', 'Topología');
add('planner.results.recommendedTopology', 'Recommended topology', 'Topologia recomendada', 'Topología recomendada');
add('planner.results.hardware', 'Hardware', 'Hardware', 'Hardware');
add('planner.results.storage', 'Storage', 'Armazenamento', 'Almacenamiento');
add('planner.results.management', 'Management', 'Management', 'Management');
add('planner.results.network', 'Network', 'Rede', 'Red');
add('planner.results.prerequisites', 'Prerequisites', 'Pré-requisitos', 'Requisitos previos');
add('planner.results.documentation', 'Documentation reference', 'Referência de documentação', 'Referencia de documentación');
add('planner.results.copySummary', 'Copy summary (Markdown)', 'Copiar resumo (Markdown)', 'Copiar resumen (Markdown)');
add('planner.results.deployGuide', 'Deploy this topology', 'Implementar esta topologia', 'Implementar esta topología');
add('planner.results.jumpToResults', 'Jump to results', 'Ir para resultados', 'Ir a resultados');
add('planner.results.disclaimer', 'Estimates only. Validate with Splunk Sales or PS for production commitments.', 'Apenas estimativas. Valide com Splunk Sales ou PS para compromissos de produção.', 'Solo estimaciones. Valide con Splunk Sales o PS para compromisos de producción.');
add('planner.results.hecNote', 'HEC (TCP/8088) is always included on the indexing tier.', 'HEC (TCP/8088) está sempre incluído no indexing tier.', 'HEC (TCP/8088) siempre está incluido en el indexing tier.');
add('planner.results.firewallChecklist', 'Firewall checklist', 'Checklist de firewall', 'Lista de comprobación de firewall');
add('planner.results.perIndexer', 'Per indexer', 'Por indexer', 'Por indexer');
add('planner.results.clusterTotal', 'Cluster total', 'Total do cluster', 'Total del cluster');
add('planner.results.hotWarm', 'Hot/warm', 'Hot/warm', 'Hot/warm');
add('planner.results.cold', 'Cold', 'Cold', 'Cold');
add('planner.results.frozenArchive', 'Frozen/Archive', 'Frozen/Archive', 'Frozen/Archive');
add('planner.results.total', 'Total', 'Total', 'Total');
add('planner.results.dayLifecycle', '{days} day lifecycle', 'Ciclo de vida de {days} dias', 'Ciclo de vida de {days} días');
add('planner.results.premiumApps', 'Premium apps', 'Apps premium', 'Apps premium');
add('planner.results.premiumNone', 'None', 'Nenhuma', 'Ninguna');
add('planner.results.indexingTier', 'Indexing tier', 'Indexing tier', 'Indexing tier');
add('planner.results.indexers', 'Indexers', 'Indexers', 'Indexers');
add('planner.results.searchHeads', 'SH', 'SH', 'SH');
add('planner.results.ingestDaily', 'Daily ingest: {value} GB/day', 'Ingest diário: {value} GB/day', 'Ingest diario: {value} GB/day');
add('planner.results.ingestFromEps', 'Resolved from EPS: {value} GB/day', 'Resolvido a partir de EPS: {value} GB/day', 'Resuelto desde EPS: {value} GB/day');
add('planner.results.clusterLine', 'Cluster: {mode} — {indexers} indexers @ {maxVolume} GB/day max per index', 'Cluster: {mode} — {indexers} indexers @ {maxVolume} GB/dia máx. por index', 'Cluster: {mode} — {indexers} indexers @ {maxVolume} GB/día máx. por index');
add('planner.results.clusterAuto', 'Auto', 'Auto', 'Auto');
add('planner.results.clusterManual', 'Manual', 'Manual', 'Manual');
add('planner.results.includedCombined', 'Included in combined instance', 'Incluído na instância combinada', 'Incluido en instancia combinada');
add('planner.results.tableRole', 'Role', 'Função', 'Rol');
add('planner.results.tableQty', 'Qty', 'Qtd', 'Cant');
add('planner.results.tableCompute', 'Compute', 'Compute', 'Compute');
add('planner.results.tableDisk', 'Disk (guide)', 'Disco (guia)', 'Disco (guía)');
add('planner.results.tableSpecSource', 'Spec source', 'Origem da spec', 'Origen de spec');
add('planner.results.tableTier', 'Tier', 'Tier', 'Tier');
add('planner.results.tableComponent', 'Component', 'Componente', 'Componente');
add('planner.results.tablePort', 'Port', 'Porta', 'Puerto');
add('planner.results.tablePurpose', 'Purpose', 'Propósito', 'Propósito');
add('planner.results.tableAction', 'Action', 'Ação', 'Acción');
add('planner.results.copied', 'Copied!', 'Copiado!', '¡Copiado!');
add('planner.results.copySummaryShort', 'Copy summary', 'Copiar resumo', 'Copiar resumen');
add('planner.results.shcSuffix', '(SHC)', '(SHC)', '(SHC)');
add('planner.results.hardwareCompute', '{physicalCores}c / {vcpu} vCPU / {ramGb} GB RAM', '{physicalCores}c / {vcpu} vCPU / {ramGb} GB RAM', '{physicalCores}c / {vcpu} vCPU / {ramGb} GB RAM');
add('planner.results.hardwareDisk', '{osDiskGb} GB OS · {splunkDiskGb}+ GB Splunk', '{osDiskGb} GB OS · {splunkDiskGb}+ GB Splunk', '{osDiskGb} GB OS · {splunkDiskGb}+ GB Splunk');
add('planner.results.diskType.sh', 'SSD', 'SSD', 'SSD');
add('planner.results.diskType.idx', 'SSD for Hot/Warm & HDD for Cold/Frozen', 'SSD para Hot/Warm e HDD para Cold/Frozen', 'SSD para Hot/Warm y HDD para Cold/Frozen');
add('planner.results.diskType.mgmt', 'SSD or HDD', 'SSD ou HDD', 'SSD o HDD');
add('planner.results.storageLine', '{label}: {tb} ({days}d)', '{label}: {tb} ({days}d)', '{label}: {tb} ({days}d)');
add('planner.subtitleGuideLink', 'Linux deployment guide', 'Guia de implantação Linux', 'Guía de implementación Linux');
add('planner.disclaimer', 'This planner provides guidance and estimates only — always validate against official Splunk reference architectures and your real workload before deploying.', 'Este planejador fornece apenas orientações e estimativas — valide sempre com as arquiteturas de referência oficiais da Splunk e a sua carga de trabalho real antes de implementar.', 'Este planificador ofrece solo orientación y estimaciones — valide siempre con las arquitecturas de referencia oficiales de Splunk y su carga de trabajo real antes de implementar.');

add('planner.docs.sva', 'Splunk Validated Architectures', 'Splunk Validated Architectures', 'Splunk Validated Architectures');
add('planner.docs.hardware104', 'Splunk Enterprise 10.4 — Reference hardware', 'Splunk Enterprise 10.4 — Reference hardware', 'Splunk Enterprise 10.4 — Reference hardware');
add('planner.docs.performance104', 'Splunk Enterprise 10.4 — Summary of performance recommendations', 'Splunk Enterprise 10.4 — Summary of performance recommendations', 'Splunk Enterprise 10.4 — Summary of performance recommendations');
add('planner.docs.network104', 'Splunk Enterprise 10.4 — Network components', 'Splunk Enterprise 10.4 — Network components', 'Splunk Enterprise 10.4 — Network components');
add('planner.docs.management104', 'Splunk Enterprise 10.4 — Management components', 'Splunk Enterprise 10.4 — Management components', 'Splunk Enterprise 10.4 — Management components');
add('planner.docs.esMinimum', 'Enterprise Security 8.5 — Production minimums', 'Enterprise Security 8.5 — Production minimums', 'Enterprise Security 8.5 — Production minimums');
add('planner.docs.itsiPlanning', 'ITSI 4.21 — Plan your deployment', 'ITSI 4.21 — Plan your deployment', 'ITSI 4.21 — Plan your deployment');

// --- ADVISORY (topologyEngine + managementPlanner + topologyResolver + clusterFactors) ---
add('advisory.s1Combined', 'S1: all core roles run on a single combined instance.', 'S1: todas as funções core correm numa única instância combinada.', 'S1: todos los roles core se ejecutan en una única instancia combinada.');
add('advisory.indexingTier', 'Indexing tier (auto): {prefixLabel}', 'Indexing tier (auto): {prefixLabel}', 'Indexing tier (auto): {prefixLabel}');
add('advisory.perfCombined', '{summary} A single-server deployment may fit this profile.', '{summary} Uma implantação single-server pode adequar-se a este perfil.', '{summary} Una implementación single-server puede encajar en este perfil.');
add('advisory.perfUnder', '{summary} Table guideline: {recommendedIndexers} indexer(s); plan uses {indexers}.', '{summary} Diretriz da tabela: {recommendedIndexers} indexer(s); o plano usa {indexers}.', '{summary} Directriz de tabla: {recommendedIndexers} indexer(s); el plan usa {indexers}.');
add('advisory.perfSummary', '{summary}', '{summary}', '{summary}');
add('advisory.ingestExceeds', 'Daily ingest exceeds ~{maxVolumePerIndexGb} GB/day × {indexers} indexer(s).', 'Ingest diário excede ~{maxVolumePerIndexGb} GB/dia × {indexers} indexer(s).', 'Ingest diario supera ~{maxVolumePerIndexGb} GB/día × {indexers} indexer(s).');
add('advisory.esItsiSeparate', 'Enterprise Security and ITSI cannot share the same search head. Separate dedicated search tiers are required.', 'Enterprise Security e ITSI não podem partilhar o mesmo search head. São necessários search tiers dedicados separados.', 'Enterprise Security e ITSI no pueden compartir el mismo search head. Se requieren search tiers dedicados separados.');
add('advisory.itsiShcRecommend', 'For ITSI beyond ~200 KPIs, a search head cluster is recommended for stability.', 'Para ITSI além de ~200 KPIs, recomenda-se search head cluster para estabilidade.', 'Para ITSI más allá de ~200 KPIs, se recomienda search head cluster para estabilidad.');
add('advisory.cluster', 'Cluster: {indexers} indexers, RF={rf}, SF={sf}{autoSuffix}', 'Cluster: {indexers} indexers, RF={rf}, SF={sf}{autoSuffix}', 'Cluster: {indexers} indexers, RF={rf}, SF={sf}{autoSuffix}');
add('advisory.clusterAutoSuffix', ' (auto configuration)', ' (configuração automática)', ' (configuración automática)');
add('advisory.clusterManualSuffix', ' (manual)', ' (manual)', ' (manual)');
add('advisory.virtual', 'Virtual: reserve CPU/RAM; use thick-provisioned disks for indexers.', 'Virtual: reserve CPU/RAM; use discos thick-provisioned para indexers.', 'Virtual: reserve CPU/RAM; use discos thick-provisioned para indexers.');
add('advisory.esKvStore', 'Enterprise Security: isolated search tier (+10 SVA). KV Store on ES search heads (8065, 8191).', 'Enterprise Security: search tier isolado (+10 SVA). KV Store nos search heads ES (8065, 8191).', 'Enterprise Security: search tier aislado (+10 SVA). KV Store en search heads ES (8065, 8191).');
add('advisory.itsiRealtime', 'ITSI: real-time searches cannot be disabled on ITSI tiers.', 'ITSI: pesquisas em tempo real não podem ser desativadas nos tiers ITSI.', 'ITSI: las búsquedas en tiempo real no pueden desactivarse en tiers ITSI.');
add('advisory.shcLb', 'SHC: configure load balancer cookie-based sticky sessions on TCP/8000.', 'SHC: configure load balancer com sticky sessions baseadas em cookie em TCP/8000.', 'SHC: configure load balancer con sticky sessions basadas en cookie en TCP/8000.');
add('advisory.singleServerNotRecommended', 'Single-instance (S1) is not recommended above ~300 GB/day.', 'Instância única (S1) não recomendada acima de ~300 GB/dia.', 'Instancia única (S1) no recomendada por encima de ~300 GB/día.');
add('advisory.shcMinMembers', 'SHC requires at least {min} search heads.', 'SHC requer pelo menos {min} search heads.', 'SHC requiere al menos {min} search heads.');
add('advisory.nonClusterRfSf', 'Non-clustered deployment: RF and SF set to 1.', 'Implantação não clusterizada: RF e SF definidos como 1.', 'Implementación no clusterizada: RF y SF establecidos en 1.');
add('advisory.rfLowered', 'Replication factor lowered from {from} to {to} (cannot exceed indexer count).', 'Replication factor reduzido de {from} para {to} (não pode exceder número de indexers).', 'Replication factor reducido de {from} a {to} (no puede superar número de indexers).');
add('advisory.sfLowered', 'Search factor lowered from {from} to {to} (cannot exceed replication factor).', 'Search factor reduzido de {from} para {to} (não pode exceder replication factor).', 'Search factor reducido de {from} a {to} (no puede superar replication factor).');
add('advisory.mgmtSingleServer', 'Single-server (S1): management roles run on the combined instance.', 'Single-server (S1): funções de management correm na instância combinada.', 'Single-server (S1): roles de management se ejecutan en la instancia combinada.');
add('advisory.mgmtNeverColocateCmDs', 'Never colocate Deployment Server and Cluster Manager.', 'Nunca colocalizar Deployment Server e Cluster Manager.', 'Nunca colocalizar Deployment Server y Cluster Manager.');
add('advisory.mgmtDsDedicated', '>{threshold} clients: Deployment Server should be dedicated.', '>{threshold} clientes: Deployment Server deve ser dedicado.', '>{threshold} clientes: Deployment Server debe ser dedicado.');
add('advisory.mgmtAuto', 'Auto: Cluster Manager and SHC Deployer on dedicated hosts when applicable; LM, MC, and DS (≤50 clients) may colocate.', 'Auto: Cluster Manager e SHC Deployer em hosts dedicados quando aplicável; LM, MC e DS (≤50 clientes) podem colocalizar.', 'Auto: Cluster Manager y SHC Deployer en hosts dedicados cuando aplique; LM, MC y DS (≤50 clientes) pueden colocalizar.');
add('advisory.mgmtInvalidCmDs', 'Invalid: CM and DS cannot share a host — CM moved to dedicated.', 'Inválido: CM e DS não podem partilhar host — CM movido para dedicado.', 'Inválido: CM y DS no pueden compartir host — CM movido a dedicado.');
add('advisory.mgmtColocated', 'Colocated management components', 'Componentes de management colocalizados', 'Componentes de management colocalizados');
add('advisory.mgmtCmSeparated', 'Separated from Deployment Server per Splunk guidance', 'Separado do Deployment Server conforme orientação Splunk', 'Separado del Deployment Server según orientación Splunk');
add('advisory.mgmtHostColocated', 'Management node (colocated)', 'Nó de management (colocalizado)', 'Nodo de management (colocalizado)');
add('advisory.mgmtHostCmDedicated', 'Cluster Manager (dedicated)', 'Cluster Manager (dedicated)', 'Cluster Manager (dedicated)');
add('advisory.mgmtHostDsDedicated', '{role} (dedicated)', '{role} (dedicated)', '{role} (dedicated)');

// --- Write locale files ---
function escapeTs(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function writeLocale(locale, constName) {
  const keys = Object.keys(catalogs.en).sort();
  const ptKeys = Object.keys(catalogs.pt).sort();
  const esKeys = Object.keys(catalogs.es).sort();
  if (locale !== 'en') {
    if (keys.length !== ptKeys.length || keys.join() !== ptKeys.join()) {
      throw new Error(`Key mismatch en vs pt: en=${keys.length} pt=${ptKeys.length}`);
    }
    if (keys.join() !== esKeys.join()) {
      throw new Error(`Key mismatch en vs es`);
    }
  }
  const lines = keys.map((k) => `  '${escapeTs(k)}': '${escapeTs(catalogs[locale][k])}',`);
  const content = `export const ${constName}: Record<string, string> = {\n${lines.join('\n')}\n};\n`;
  writeFileSync(join(outDir, `${locale}.ts`), content, 'utf8');
  console.log(`Wrote ${locale}.ts (${keys.length} keys)`);
}

writeLocale('en', 'enMessages');
writeLocale('pt', 'ptMessages');
writeLocale('es', 'esMessages');
console.log('Done.');

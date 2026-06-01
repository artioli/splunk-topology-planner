import { buildSubstitutionMap } from './hostDefaults';
import type { HostConfig } from './types';

const VAR_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

export function buildExtraSubstitutions(extra?: Record<string, string>): Record<string, string> {
  return extra ?? {};
}

export function substitute(text: string, config: HostConfig, extra?: Record<string, string>): string {
  const map = { ...buildSubstitutionMap(config), ...buildExtraSubstitutions(extra) };
  return text.replace(VAR_PATTERN, (_, key: string) => map[key] ?? `{{${key}}}`);
}

export function substituteCommands(
  commands: string[],
  config: HostConfig,
  extra?: Record<string, string>,
): string[] {
  return commands.map((c) => substitute(c, config, extra));
}

export function containsUnresolvedPlaceholders(text: string): boolean {
  return VAR_PATTERN.test(text);
}

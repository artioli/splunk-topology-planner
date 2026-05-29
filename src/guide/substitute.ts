import { buildSubstitutionMap } from './hostDefaults';
import type { HostConfig } from './types';

const VAR_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

export function substitute(text: string, config: HostConfig): string {
  const map = buildSubstitutionMap(config);
  return text.replace(VAR_PATTERN, (_, key: string) => map[key] ?? `{{${key}}}`);
}

export function substituteCommands(commands: string[], config: HostConfig): string[] {
  return commands.map((c) => substitute(c, config));
}

export function containsUnresolvedPlaceholders(text: string): boolean {
  return VAR_PATTERN.test(text);
}

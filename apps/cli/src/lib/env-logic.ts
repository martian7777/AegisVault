export interface EnvVarPayload {
  project: string;
  environment: string;
  key: string;
  value: string;
}

type EnvVarItem = { id: string; payload: EnvVarPayload };

/** Pure filters, extracted for direct unit testing without spawning a process. */
export function filterByProjectEnvironment(
  items: EnvVarItem[],
  project: string,
  environment: string,
): EnvVarItem[] {
  return items.filter(
    (item) => item.payload.project === project && item.payload.environment === environment,
  );
}

export function findEnvVarMatch(
  items: EnvVarItem[],
  project: string,
  environment: string,
  key: string,
): EnvVarItem | undefined {
  return items.find(
    (item) =>
      item.payload.project === project &&
      item.payload.environment === environment &&
      item.payload.key === key,
  );
}

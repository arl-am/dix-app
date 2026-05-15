import { isDevEnvironment } from './env';

export type DvClient = {
  retrieveMultipleRecordsAsync<T>(
    entitySetName: string,
    options?: { select?: string[]; filter?: string; orderBy?: string[]; top?: number } | string,
  ): Promise<{ data: T[] }>;
  retrieveRecordAsync<T>(
    entitySetName: string,
    id: string,
    options?: { select?: string[] } | string,
  ): Promise<{ data: T }>;
  createRecordAsync<TIn, TOut>(entitySetName: string, body: TIn): Promise<{ data: TOut }>;
  updateRecordAsync<TIn, TOut>(entitySetName: string, id: string, patch: TIn): Promise<{ data: TOut }>;
  deleteRecordAsync(entitySetName: string, id: string): Promise<{ data: unknown }>;
};

let clientPromise: Promise<DvClient> | null = null;

export async function getDVClient(): Promise<DvClient> {
  if (isDevEnvironment) {
    throw new Error('getDVClient() called in dev. Hooks must short-circuit to mock data.');
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const [{ getClient }, { dataSourcesInfo }] = await Promise.all([
        import('@microsoft/power-apps/data'),
        import('../../.power/schemas/appschemas/dataSourcesInfo'),
      ]);
      return getClient(dataSourcesInfo as never) as unknown as DvClient;
    })();
  }
  return clientPromise;
}

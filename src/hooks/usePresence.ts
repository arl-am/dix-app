import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { isLocal } from '../lib/utils';

export interface ActiveUser {
  userId: string;
  userName: string;
  lastSeen: string;
}

const PING_INTERVAL_MS = 5 * 60 * 1000;
const STALE_THRESHOLD_MS = 6 * 60 * 1000;

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function getClient() {
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  return getClient(dataSourcesInfo);
}

async function fetchActive(): Promise<ActiveUser[]> {
  if (isLocal) {
    return [
      { userId: 'u1', userName: 'Anderson Marquez', lastSeen: new Date().toISOString() },
      { userId: 'u2', userName: 'Susan Reisker', lastSeen: new Date(Date.now() - 90_000).toISOString() },
      { userId: 'u3', userName: 'David Truong', lastSeen: new Date(Date.now() - 210_000).toISOString() },
    ];
  }
  const client = await getClient();
  const sinceIso = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  const result: any = await client.retrieveMultipleRecordsAsync('cr6cd_dixpresences', {
    select: ['cr6cd_dixpresenceid', 'cr6cd_userid', 'cr6cd_username', 'cr6cd_lastseen'],
    filter: `cr6cd_lastseen gt ${sinceIso}`,
    orderBy: ['cr6cd_lastseen desc'],
    top: 100,
  });
  const rows = (result.data || []) as any[];
  const byUser = new Map<string, ActiveUser>();
  for (const r of rows) {
    const userId = r.cr6cd_userid;
    if (!userId) continue;
    const existing = byUser.get(userId);
    const candidate = {
      userId,
      userName: r.cr6cd_username || 'Unknown',
      lastSeen: r.cr6cd_lastseen || '',
    };
    if (!existing || candidate.lastSeen > existing.lastSeen) byUser.set(userId, candidate);
  }
  return Array.from(byUser.values()).sort((a, b) => (b.lastSeen || '').localeCompare(a.lastSeen || ''));
}

export function usePresence() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ userId: string; userName: string } | null>(null);
  const presenceIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let stopped = false;

    const initial = async () => {
      try {
        if (isLocal) {
          setCurrentUser({ userId: 'u1', userName: 'Anderson Marquez' });
          setActiveUsers(await fetchActive());
          return;
        }
        const client = await getClient();

        const createResult: any = await client.createRecordAsync('cr6cd_dixpresences', {
          cr6cd_name: 'Active Session',
          cr6cd_lastseen: new Date().toISOString(),
        });
        const created = createResult.data || createResult;
        const userId: string = created['_createdby_value'] || '';
        const userName: string = created['_createdby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown';
        const presenceId: string = created['cr6cd_dixpresenceid'] || '';
        if (!presenceId) return;

        presenceIdRef.current = presenceId;
        setCurrentUser({ userId, userName });

        await client.updateRecordAsync('cr6cd_dixpresences', presenceId, {
          cr6cd_userid: userId,
          cr6cd_username: userName,
          cr6cd_name: userName,
        });

        if (!stopped) setActiveUsers(await fetchActive());
      } catch (err) {
        console.warn('[presence] init failed', err);
      }
    };

    const ping = async () => {
      try {
        if (isLocal) {
          setActiveUsers(await fetchActive());
          return;
        }
        const client = await getClient();
        const presenceId = presenceIdRef.current;
        if (presenceId) {
          await client.updateRecordAsync('cr6cd_dixpresences', presenceId, {
            cr6cd_lastseen: new Date().toISOString(),
          });
        }
        if (!stopped) setActiveUsers(await fetchActive());
      } catch (err) {
        console.warn('[presence] ping failed', err);
      }
    };

    initial();
    const timer = setInterval(ping, PING_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') ping();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return { activeUsers, currentUser };
}

export { deriveInitials };

interface PresenceValue {
  activeUsers: ActiveUser[];
  currentUser: { userId: string; userName: string } | null;
}

const PresenceContext = createContext<PresenceValue>({ activeUsers: [], currentUser: null });

export function PresenceProvider({ children }: { children: ReactNode }) {
  const value = usePresence();
  return createElement(PresenceContext.Provider, { value }, children);
}

export function usePresenceContext(): PresenceValue {
  return useContext(PresenceContext);
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import { MOCK_CXL_NOTES, type CxlNote, type NoteLike } from '../lib/mockData';

const SELECT = [
  'cr6cd_dixcxlnoteid', 'cr6cd_name', 'cr6cd_body', 'cr6cd_likedby',
  '_cr6cd_notecancellation_value', '_cr6cd_parentnote_value',
  'createdon', '_createdby_value',
];

async function getDV() {
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  return getClient(dataSourcesInfo);
}

let mockDb: CxlNote[] = [...MOCK_CXL_NOTES];

async function fetchNotes(cancellationId: string): Promise<CxlNote[]> {
  if (isLocal) {
    return mockDb.filter((n) => n._cr6cd_notecancellation_value === cancellationId);
  }
  const client = await getDV();
  const result: any = await client.retrieveMultipleRecordsAsync('cr6cd_dixcxlnotes', {
    select: SELECT,
    filter: `_cr6cd_notecancellation_value eq ${cancellationId}`,
    orderBy: ['createdon asc'],
    top: 200,
  });
  const rows = (result.data || []) as any[];
  return rows.map((r) => ({
    ...r,
    createdByName: r.createdByName ?? r['_createdby_value@OData.Community.Display.V1.FormattedValue'] ?? '',
    createdById: r.createdById ?? r._createdby_value ?? '',
  })) as CxlNote[];
}

export function useCxlNotes(cancellationId: string | null) {
  return useQuery({
    queryKey: ['cxl-notes', cancellationId],
    queryFn: () => fetchNotes(cancellationId!),
    enabled: !!cancellationId,
  });
}

export interface CreateNoteInput {
  cancellationId: string;
  body: string;
  parentNoteId?: string | null;
  authorName: string;
  authorId: string;
}

async function createNote(input: CreateNoteInput): Promise<CxlNote> {
  if (isLocal) {
    const note: CxlNote = {
      cr6cd_dixcxlnoteid: 'note-' + crypto.randomUUID().slice(0, 8),
      cr6cd_name: 'Note',
      cr6cd_body: input.body,
      _cr6cd_notecancellation_value: input.cancellationId,
      _cr6cd_parentnote_value: input.parentNoteId || null,
      createdon: new Date().toISOString(),
      createdByName: input.authorName,
      createdById: input.authorId,
    };
    mockDb = [...mockDb, note];
    return note;
  }
  const client = await getDV();
  const body: Record<string, unknown> = {
    cr6cd_name: 'Note',
    cr6cd_body: input.body,
    'cr6cd_notecancellation@odata.bind': `/cr6cd_dix_cancellations(${input.cancellationId})`,
  };
  if (input.parentNoteId) {
    body['cr6cd_parentnote@odata.bind'] = `/cr6cd_dixcxlnotes(${input.parentNoteId})`;
  }
  const result: any = await client.createRecordAsync('cr6cd_dixcxlnotes', body);
  return result.data ?? result;
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cxl-notes', vars.cancellationId] }),
  });
}

export interface ToggleLikeInput {
  cancellationId: string;
  noteId: string;
  userId: string;
  userName: string;
  currentLikedBy?: string;
}

function parseLikes(json: string | undefined | null): NoteLike[] {
  if (!json) return [];
  try { return JSON.parse(json) as NoteLike[]; } catch { return []; }
}

async function toggleLike(input: ToggleLikeInput): Promise<NoteLike[]> {
  const existing = parseLikes(input.currentLikedBy);
  const already = existing.some((l) => l.userId === input.userId);
  const next = already
    ? existing.filter((l) => l.userId !== input.userId)
    : [...existing, { userId: input.userId, userName: input.userName, likedAt: new Date().toISOString() }];
  const json = JSON.stringify(next);

  if (isLocal) {
    mockDb = mockDb.map((n) => n.cr6cd_dixcxlnoteid === input.noteId ? { ...n, cr6cd_likedby: json } : n);
    return next;
  }
  const client = await getDV();
  await client.updateRecordAsync('cr6cd_dixcxlnotes', input.noteId, { cr6cd_likedby: json });
  return next;
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleLike,
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cxl-notes', vars.cancellationId] }),
  });
}

export interface DeleteNoteInput { cancellationId: string; noteId: string }

async function deleteNote(input: DeleteNoteInput): Promise<void> {
  if (isLocal) {
    mockDb = mockDb.filter((n) => n.cr6cd_dixcxlnoteid !== input.noteId && n._cr6cd_parentnote_value !== input.noteId);
    return;
  }
  const client = await getDV();
  await client.deleteRecordAsync('cr6cd_dixcxlnotes', input.noteId);
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cxl-notes', vars.cancellationId] }),
  });
}

export { parseLikes };

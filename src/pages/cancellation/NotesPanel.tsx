import { useMemo, useState } from 'react';
import { Heart, MessageCircleReply, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { colorForUser } from '../../lib/userColor';
import { usePresenceContext } from '../../hooks/usePresence';
import {
  useCxlNotes,
  useCreateNote,
  useToggleLike,
  useDeleteNote,
  parseLikes,
} from '../../hooks/useCxlNotes';
import type { CxlNote } from '../../lib/mockData';

interface Props {
  cancellationId: string;
}

function initialsOf(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0].toUpperCase();
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const c = colorForUser(name);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{ backgroundColor: c.bg, width: size, height: size, fontSize: size * 0.42 }}
    >
      {initialsOf(name)}
    </div>
  );
}

interface NoteItemProps {
  note: CxlNote;
  replies: CxlNote[];
  cancellationId: string;
  currentUserId: string;
  currentUserName: string;
  depth?: number;
}

function NoteItem({ note, replies, cancellationId, currentUserId, currentUserName, depth = 0 }: NoteItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showLikers, setShowLikers] = useState(false);
  const createNote = useCreateNote();
  const toggleLike = useToggleLike();
  const deleteNote = useDeleteNote();

  const likes = parseLikes(note.cr6cd_likedby);
  const liked = likes.some((l) => l.userId === currentUserId);
  const authorName = note.createdByName || 'Unknown';

  const handleLike = () => {
    toggleLike.mutate({
      cancellationId,
      noteId: note.cr6cd_dixcxlnoteid,
      userId: currentUserId,
      userName: currentUserName,
      currentLikedBy: note.cr6cd_likedby,
    });
  };

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    createNote.mutate(
      {
        cancellationId,
        body: replyText,
        parentNoteId: note.cr6cd_dixcxlnoteid,
        authorName: currentUserName,
        authorId: currentUserId,
      },
      {
        onSuccess: () => {
          setReplyText('');
          setReplyOpen(false);
          toast.success('Reply posted');
        },
      },
    );
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this note?')) return;
    deleteNote.mutate({ cancellationId, noteId: note.cr6cd_dixcxlnoteid });
  };

  const isOwn = note.createdById === currentUserId;

  return (
    <div className={cn('relative', depth > 0 && 'pl-9 mt-2')} style={{ animation: 'fade-in-up 0.25s ease-out both' }}>
      {depth > 0 && (
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      )}
      <div className="flex items-start gap-2.5">
        <Avatar name={authorName} size={depth > 0 ? 24 : 30} />
        <div className="flex-1 min-w-0">
          <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-3 py-2 transition-colors duration-200 hover:bg-muted/60">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-foreground">{authorName}</span>
              <span className="text-[10px] text-muted-foreground">{relativeTime(note.createdon)}</span>
            </div>
            <p className="text-sm text-foreground break-words">{note.cr6cd_body}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] text-muted-foreground">
            <button
              onClick={handleLike}
              onMouseEnter={() => likes.length > 0 && setShowLikers(true)}
              onMouseLeave={() => setShowLikers(false)}
              className={cn(
                'inline-flex items-center gap-1 transition-all duration-200 active:scale-90 relative',
                liked ? 'text-rose-500 font-semibold' : 'hover:text-foreground',
              )}
            >
              <Heart className={cn('w-3.5 h-3.5 transition-transform duration-200', liked && 'fill-rose-500')} />
              {likes.length > 0 && <span>{likes.length}</span>}
              {showLikers && likes.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 bg-foreground text-background text-[10px] rounded-md px-2 py-1 whitespace-nowrap z-10 shadow-lg pointer-events-none animate-fade-in-up">
                  {likes.map((l) => l.userName).join(', ')}
                </div>
              )}
            </button>
            {depth === 0 && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150"
              >
                <MessageCircleReply className="w-3.5 h-3.5" /> Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 hover:text-destructive transition-colors duration-150 ml-auto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {replyOpen && (
            <div className="mt-2 flex items-center gap-2 animate-fade-in-down">
              <Avatar name={currentUserName} size={22} />
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReply(); }}
                placeholder={`Reply to ${authorName.split(' ')[0]}…`}
                className="flex-1 h-8 rounded-full bg-muted/50 border border-transparent px-3 text-xs outline-none transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || createNote.isPending}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {replies.map((r) => (
            <NoteItem
              key={r.cr6cd_dixcxlnoteid}
              note={r}
              replies={[]}
              cancellationId={cancellationId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotesPanel({ cancellationId }: Props) {
  const { currentUser } = usePresenceContext();
  const { data: notes = [], isLoading } = useCxlNotes(cancellationId);
  const createNote = useCreateNote();
  const [draft, setDraft] = useState('');

  const currentUserId = currentUser?.userId || 'anonymous';
  const currentUserName = currentUser?.userName || 'You';

  const { roots, repliesByParent } = useMemo(() => {
    const r: CxlNote[] = [];
    const m = new Map<string, CxlNote[]>();
    for (const n of notes) {
      if (n._cr6cd_parentnote_value) {
        const arr = m.get(n._cr6cd_parentnote_value) || [];
        arr.push(n);
        m.set(n._cr6cd_parentnote_value, arr);
      } else {
        r.push(n);
      }
    }
    return { roots: r, repliesByParent: m };
  }, [notes]);

  const handlePost = () => {
    if (!draft.trim()) return;
    createNote.mutate(
      { cancellationId, body: draft, authorName: currentUserName, authorId: currentUserId },
      {
        onSuccess: () => {
          setDraft('');
          toast.success('Note posted');
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {isLoading && <p className="text-xs text-muted-foreground text-center py-6">Loading notes…</p>}
        {!isLoading && roots.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <MessageCircleReply className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Drop the first comment for the team.</p>
          </div>
        )}
        {roots.map((n) => (
          <NoteItem
            key={n.cr6cd_dixcxlnoteid}
            note={n}
            replies={repliesByParent.get(n.cr6cd_dixcxlnoteid) || []}
            cancellationId={cancellationId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        ))}
      </div>

      <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center gap-2">
        <Avatar name={currentUserName} size={30} />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePost(); }}
          placeholder="Add a note…"
          className="flex-1 h-9 rounded-full bg-card border border-border px-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={handlePost}
          disabled={!draft.trim() || createNote.isPending}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

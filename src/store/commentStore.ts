// Comments Store — 3.4 Pin Comments & Annotations
import { create } from "zustand";
import type { Comment, CommentReply, NodeId } from "../types/canvas";

const AVATAR_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

interface CommentStoreState {
  comments: Comment[];
  isCommentsOpen: boolean;
  showResolved: boolean;
  activeCommentId: string | null;
  currentAuthor: string;
  currentAvatarColor: string;
}

interface CommentStoreActions {
  openComments: () => void;
  closeComments: () => void;
  toggleShowResolved: () => void;
  setActiveComment: (id: string | null) => void;
  setAuthor: (name: string) => void;
  addComment: (text: string, elementId?: NodeId, position?: { x: number; y: number }) => Comment;
  replyToComment: (commentId: string, text: string) => void;
  resolveComment: (commentId: string) => void;
  unresolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  deleteReply: (commentId: string, replyId: string) => void;
  editComment: (commentId: string, text: string) => void;
  getCommentsForElement: (elementId: NodeId) => Comment[];
  getUnresolvedCount: () => number;
  loadComments: (comments: Comment[]) => void;
}

type CommentStore = CommentStoreState & CommentStoreActions;

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  isCommentsOpen: false,
  showResolved: false,
  activeCommentId: null,
  currentAuthor: "You",
  currentAvatarColor: AVATAR_COLORS[0],

  openComments: () => set({ isCommentsOpen: true }),
  closeComments: () => set({ isCommentsOpen: false }),
  toggleShowResolved: () => set((s) => ({ showResolved: !s.showResolved })),
  setActiveComment: (id) => set({ activeCommentId: id }),
  setAuthor: (name) => set({ currentAuthor: name }),

  addComment: (text, elementId, position) => {
    const { currentAuthor, currentAvatarColor } = get();
    const comment: Comment = {
      id: crypto.randomUUID(),
      elementId,
      position: position || { x: 100, y: 100 },
      text,
      author: currentAuthor,
      avatarColor: currentAvatarColor,
      timestamp: Date.now(),
      resolved: false,
      replies: [],
    };
    set((s) => ({ comments: [...s.comments, comment], activeCommentId: comment.id }));
    return comment;
  },

  replyToComment: (commentId, text) => {
    const { currentAuthor, currentAvatarColor } = get();
    const reply: CommentReply = {
      id: crypto.randomUUID(),
      text,
      author: currentAuthor,
      avatarColor: currentAvatarColor,
      timestamp: Date.now(),
    };
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ),
    }));
  },

  resolveComment: (commentId) => {
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, resolved: true } : c
      ),
    }));
  },

  unresolveComment: (commentId) => {
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, resolved: false } : c
      ),
    }));
  },

  deleteComment: (commentId) => {
    set((s) => ({
      comments: s.comments.filter((c) => c.id !== commentId),
      activeCommentId: s.activeCommentId === commentId ? null : s.activeCommentId,
    }));
  },

  deleteReply: (commentId, replyId) => {
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId
          ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
          : c
      ),
    }));
  },

  editComment: (commentId, text) => {
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, text } : c
      ),
    }));
  },

  getCommentsForElement: (elementId) => {
    return get().comments.filter((c) => c.elementId === elementId);
  },

  getUnresolvedCount: () => {
    return get().comments.filter((c) => !c.resolved).length;
  },

  loadComments: (comments) => set({ comments }),
}));

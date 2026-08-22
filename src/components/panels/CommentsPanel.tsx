// Comments Panel — 3.4 Pin Comments & Annotations
import React, { useState } from "react";
import { useCommentStore } from "../../store/commentStore";
import "../panels/PanelStyles.css";

const CommentsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const comments = useCommentStore((s) => s.comments);
  const showResolved = useCommentStore((s) => s.showResolved);
  const activeCommentId = useCommentStore((s) => s.activeCommentId);
  const toggleShowResolved = useCommentStore((s) => s.toggleShowResolved);
  const setActiveComment = useCommentStore((s) => s.setActiveComment);
  const addComment = useCommentStore((s) => s.addComment);
  const replyToComment = useCommentStore((s) => s.replyToComment);
  const resolveComment = useCommentStore((s) => s.resolveComment);
  const unresolveComment = useCommentStore((s) => s.unresolveComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const getUnresolvedCount = useCommentStore((s) => s.getUnresolvedCount);

  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const filteredComments = showResolved ? comments : comments.filter((c) => !c.resolved);
  const unresolvedCount = getUnresolvedCount();

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment.trim());
    setNewComment("");
  };

  const handleReply = (commentId: string) => {
    if (!replyText.trim()) return;
    replyToComment(commentId, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            Comments
            {unresolvedCount > 0 && <span className="panel-badge">{unresolvedCount}</span>}
          </div>
          <div className="panel-header__actions">
            <button className={`panel-btn panel-btn--small ${showResolved ? "panel-btn--primary" : ""}`} onClick={toggleShowResolved}>
              {showResolved ? "Hide Resolved" : "Show Resolved"}
            </button>
            <button className="panel-close-btn" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="panel-body">
          <div className="panel-row" style={{ gap: 8, marginBottom: 16 }}>
            <input className="panel-input" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddComment()}/>
            <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleAddComment} disabled={!newComment.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>

          {filteredComments.length === 0 ? (
            <div className="panel-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
              <div className="panel-empty__title">No Comments</div>
              <div className="panel-empty__desc">Start a discussion by adding a comment.</div>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className={`panel-card ${activeCommentId === comment.id ? "panel-card--selected" : ""} ${comment.resolved ? "" : ""}`} onClick={() => setActiveComment(comment.id)} style={{ opacity: comment.resolved ? 0.6 : 1 }}>
                <div className="panel-row panel-row--between">
                  <div className="panel-row" style={{ gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: comment.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4f0" }}>{comment.author}</div>
                      <div style={{ fontSize: 10, color: "#666680" }}>{formatTime(comment.timestamp)}</div>
                    </div>
                  </div>
                  <div className="panel-row" style={{ gap: 2 }}>
                    {comment.resolved ? (
                      <span className="panel-badge panel-badge--success" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); unresolveComment(comment.id); }}>✓ Resolved</span>
                    ) : (
                      <button className="panel-btn panel-btn--small panel-btn--icon" title="Resolve" onClick={(e) => { e.stopPropagation(); resolveComment(comment.id); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                    )}
                    <button className="panel-btn panel-btn--small panel-btn--icon panel-btn--danger" onClick={(e) => { e.stopPropagation(); deleteComment(comment.id); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#b4b4c8", marginTop: 8, lineHeight: 1.5 }}>{comment.text}</p>

                {comment.replies.length > 0 && (
                  <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
                    {comment.replies.map((reply) => (
                      <div key={reply.id} style={{ marginBottom: 8 }}>
                        <div className="panel-row" style={{ gap: 6 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: reply.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff" }}>
                            {reply.author.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#e4e4f0" }}>{reply.author}</span>
                          <span style={{ fontSize: 10, color: "#666680" }}>{formatTime(reply.timestamp)}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#b4b4c8", marginTop: 4, marginLeft: 24, lineHeight: 1.4 }}>{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === comment.id ? (
                  <div className="panel-row" style={{ gap: 6, marginTop: 8 }}>
                    <input className="panel-input" placeholder="Reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)} autoFocus style={{ fontSize: 12 }}/>
                    <button className="panel-btn panel-btn--small panel-btn--primary" onClick={() => handleReply(comment.id)}>Send</button>
                  </div>
                ) : (
                  <button className="panel-btn panel-btn--small" style={{ marginTop: 8, fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setReplyingTo(comment.id); }}>Reply</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;

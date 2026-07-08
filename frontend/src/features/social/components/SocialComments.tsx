import { useState, useEffect, useCallback } from 'react';
import { Send, Trash2, Heart } from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { useAuth } from '@contexts/AuthContext';
import type { SocialComment, CommentsResponse } from '@types';

export function SocialComments({ postId, catalogId }: { postId?: string; catalogId?: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  
  // Custom states for comment likes and user reaction mapping
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});

  const loadComments = async (p: number) => {
    setLoading(true);
    try {
      let data: CommentsResponse;
      if (postId) {
        data = await api.getPostComments(postId, p);
      } else if (catalogId) {
        data = await api.getCatalogComments(catalogId, p);
      } else return;

      if (p === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error loading comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments(1);
  }, [postId, catalogId]);

  // Synchronize comment likes states when comments are updated
  useEffect(() => {
    const likesMap: Record<string, number> = {};
    const likedMap: Record<string, boolean> = {};

    const processComment = (c: SocialComment) => {
      likesMap[c.id] = (c as any).reactionsCount || 0;
      likedMap[c.id] = (c as any).isLiked || false;

      if (c.replies) {
        c.replies.forEach(r => {
          likesMap[r.id] = (r as any).reactionsCount || 0;
          likedMap[r.id] = (r as any).isLiked || false;
        });
      }
    };

    comments.forEach(processComment);
    setCommentLikes(prev => ({ ...prev, ...likesMap }));
    setLikedComments(prev => ({ ...prev, ...likedMap }));
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await api.createSocialComment({
        content: newComment,
        postId,
        catalogId,
        parentId: replyTo || undefined,
      });
      if (replyTo) {
        setComments(prev => prev.map(c =>
          c.id === replyTo ? { ...c, replies: [...(c.replies || []), comment] } : c
        ));
      } else {
        setComments(prev => [comment, ...prev]);
      }
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error creating comment', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteSocialComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => {
        if (c.replies) {
          return { ...c, replies: c.replies.filter(r => r.id !== commentId) };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error deleting comment', err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const isLiked = likedComments[commentId] || false;
      await api.toggleSocialReaction({ commentId, type: 'like' });
      
      setLikedComments(prev => ({ ...prev, [commentId]: !isLiked }));
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] || 0) + (isLiked ? -1 : 1)),
      }));
    } catch (err) {
      console.error('Error toggling comment reaction', err);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const quickEmojis = ['❤️', '🙌', '🔥', '👏', '😍', '😢', '😂', '😝'];

  const renderComment = (comment: SocialComment) => {
    const isLiked = likedComments[comment.id] || false;
    const likesCount = commentLikes[comment.id] || 0;

    return (
      <div key={comment.id} className="ig-comment-item">
        <div className="ig-comment-avatar-wrapper">
          {comment.user.socialProfile?.avatarUrl ? (
            <img className="ig-comment-avatar" src={comment.user.socialProfile.avatarUrl} alt="" />
          ) : (
            <div className="ig-comment-avatar-placeholder">
              {(comment.user.name || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="ig-comment-content-box">
          <div className="ig-comment-text-wrapper">
            <span className="ig-comment-user">
              {comment.user.socialProfile?.displayName || comment.user.name}
            </span>
            {comment.content}
          </div>
          <div className="ig-comment-meta">
            <span>{formatCommentTime(comment.createdAt)}</span>
            {likesCount > 0 && <span>{likesCount} {likesCount === 1 ? 'Me gusta' : 'Me gustas'}</span>}
            <button className="ig-comment-reply-action" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
              Responder
            </button>
            {comment.userId === user?.id && (
              <button className="ig-comment-delete-action" onClick={() => handleDelete(comment.id)}>
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="ig-comment-replies">
              {comment.replies.map(reply => {
                const isReplyLiked = likedComments[reply.id] || false;
                const replyLikesCount = commentLikes[reply.id] || 0;

                return (
                  <div key={reply.id} className="ig-comment-item reply">
                    <div className="ig-comment-avatar-wrapper small">
                      {reply.user.socialProfile?.avatarUrl ? (
                        <img className="ig-comment-avatar small" src={reply.user.socialProfile.avatarUrl} alt="" />
                      ) : (
                        <div className="ig-comment-avatar-placeholder small">
                          {(reply.user.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ig-comment-content-box">
                      <div className="ig-comment-text-wrapper">
                        <span className="ig-comment-user">
                          {reply.user.socialProfile?.displayName || reply.user.name}
                        </span>
                        {reply.content}
                      </div>
                      <div className="ig-comment-meta">
                        <span>{formatCommentTime(reply.createdAt)}</span>
                        {replyLikesCount > 0 && <span>{replyLikesCount} Me gusta</span>}
                        {reply.userId === user?.id && (
                          <button className="ig-comment-delete-action" onClick={() => handleDelete(reply.id)}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <button className={`ig-comment-like-btn ${isReplyLiked ? 'liked' : ''}`} onClick={() => handleLikeComment(reply.id)}>
                      <Heart size={12} fill={isReplyLiked ? "var(--color-primary, #f97316)" : "transparent"} color={isReplyLiked ? "var(--color-primary, #f97316)" : "var(--text-light, #a8a8a8)"} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button className={`ig-comment-like-btn ${isLiked ? 'liked' : ''}`} onClick={() => handleLikeComment(comment.id)}>
          <Heart size={13} fill={isLiked ? "var(--color-primary, #f97316)" : "transparent"} color={isLiked ? "var(--color-primary, #f97316)" : "var(--text-light, #a8a8a8)"} />
        </button>
      </div>
    );
  };

  return (
    <div className="ig-comments-section">
      <div className="ig-comments-list">
        {comments.map(renderComment)}
        {page < totalPages && (
          <button
            className="ig-load-more-comments"
            onClick={async () => {
              const next = page + 1;
              setPage(next);
              await loadComments(next);
            }}
          >
            Cargar más comentarios
          </button>
        )}
      </div>
      <div className="ig-comment-action-dock">
        <div className="ig-quick-emojis-row">
          {quickEmojis.map(emoji => (
            <span key={emoji} className="ig-emoji-btn" onClick={() => handleAddEmoji(emoji)}>
              {emoji}
            </span>
          ))}
        </div>
        
        {replyTo && (
          <div className="ig-reply-indicator">
            Respondiendo a comentario <button onClick={() => setReplyTo(null)}>Cancelar</button>
          </div>
        )}

        <div className="ig-comment-input-row">
          <div className="ig-comment-avatar-wrapper small">
            {user?.name ? (
              <div className="ig-comment-avatar-placeholder small">
                {user.name[0].toUpperCase()}
              </div>
            ) : (
              <div className="ig-comment-avatar-placeholder small">U</div>
            )}
          </div>
          <div className="ig-comment-field-wrapper">
            <input
              type="text"
              className="ig-comment-field"
              placeholder={replyTo ? "Responder..." : "Escribe un comentario..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
            <button className="ig-comment-send-btn" onClick={handleSubmit} disabled={!newComment.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCommentTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { Skeleton } from '@shared/ui/Skeleton';
import { api } from '@shared/lib/http/client';
import type { SocialPost, FeedResponse } from '@types';
import { SocialComments } from './SocialComments';
import styles from './SocialFeed.module.css';

const reactionEmojis: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

function PostSkeleton() {
  return (
    <div className="ig-post ig-post-skeleton">
      <div className="ig-post-header">
        <div className={styles.headerRow}>
          <Skeleton variant="circle" width={32} height={32} />
          <Skeleton height={12} width={120} />
        </div>
      </div>
      <Skeleton height={400} width="100%" borderRadius={0} />
      <div className={styles.bodyPadding}>
        <div className={styles.actionRow}>
          <Skeleton variant="circle" width={22} height={22} />
          <Skeleton variant="circle" width={22} height={22} />
          <Skeleton variant="circle" width={22} height={22} />
        </div>
        <Skeleton height={10} width="30%" />
        <Skeleton height={10} width="80%" />
        <Skeleton height={10} width="50%" />
      </div>
    </div>
  );
}

export function SocialFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [reactionPicker, setReactionPicker] = useState<string | null>(null);
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  const handleNextImage = (postId: string, max: number) => {
    setActiveImageIndices((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % max,
    }));
  };

  const handlePrevImage = (postId: string, max: number) => {
    setActiveImageIndices((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + max) % max,
    }));
  };

  const handleSetImageIndex = (postId: string, index: number) => {
    setActiveImageIndices((prev) => ({
      ...prev,
      [postId]: index,
    }));
  };

  const loadFeed = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data: FeedResponse = await api.getFeed(p);
      if (p === 1) setPosts(data.posts);
      else setPosts((prev) => [...prev, ...data.posts]);
      setTotalPages(data.totalPages);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const handleReaction = async (postId: string, type: string) => {
    try {
      await api.toggleSocialReaction({ postId, type });
      setReactionPicker(null);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const hadReaction = p.reactions && p.reactions.length > 0;
            return {
              ...p,
              _count: { ...p._count, reactions: p._count.reactions + (hadReaction ? -1 : 1) },
              reactions: hadReaction ? [] : [{ type }],
            };
          }
          return p;
        })
      );
    } catch {}
  };

  const getUserReaction = (post: SocialPost): string | null =>
    post.reactions?.length ? post.reactions[0].type : null;

  const stories = [
    { id: '1', name: 'Tu historia', img: user?.name?.[0] || 'U', isOwn: true },
    { id: '2', name: 'Mercado', img: 'M' },
    { id: '3', name: 'Tienda', img: 'T' },
    { id: '4', name: 'Ofertas', img: 'O' },
  ];

  const storiesRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScrollLimits = useCallback(() => {
    if (!storiesRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = storiesRef.current;
    setShowLeftScroll(scrollLeft > 5);
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  useEffect(() => {
    const el = storiesRef.current;
    if (!el) return;

    // Check limits after rendering finishes
    const timer = setTimeout(checkScrollLimits, 300);

    el.addEventListener('scroll', checkScrollLimits);
    window.addEventListener('resize', checkScrollLimits);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScrollLimits);
      window.removeEventListener('resize', checkScrollLimits);
    };
  }, [posts, checkScrollLimits]);

  const scrollStories = (dir: 'left' | 'right') => {
    if (!storiesRef.current) return;
    const amt = 200;
    storiesRef.current.scrollBy({ left: dir === 'left' ? -amt : amt, behavior: 'smooth' });
    setTimeout(checkScrollLimits, 350);
  };

  return (
    <div className="ig-feed-layout">
      <div className="ig-feed-column">
        <div className="ig-stories-wrapper">
          {showLeftScroll && (
            <button
              className="ig-stories-scroll ig-stories-scroll-left"
              onClick={() => scrollStories('left')}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div className="ig-stories" ref={storiesRef}>
            {stories.map((story) => (
              <div key={story.id} className="ig-story-node">
                <div className={`ig-story-ring ${story.isOwn ? 'own' : ''}`}>
                  <div className="ig-story-avatar">{story.img}</div>
                </div>
                <span>{story.name}</span>
              </div>
            ))}
          </div>
          {showRightScroll && (
            <button
              className="ig-stories-scroll ig-stories-scroll-right"
              onClick={() => scrollStories('right')}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {loading && posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : (
          posts.map((post) => {
            const userReaction = getUserReaction(post);
            const isLiked = userReaction !== null;
            const activeIndex = activeImageIndices[post.id] || 0;
            return (
              <article key={post.id} className="ig-post">
                <div className="ig-post-header">
                  <div className="ig-post-user">
                    <div className="ig-avatar-xs">
                      {(post.user.socialProfile?.displayName ||
                        post.user.name ||
                        'U')[0].toUpperCase()}
                    </div>
                    <strong>{post.user.socialProfile?.displayName || post.user.name}</strong>
                  </div>
                  <MoreHorizontal size={20} />
                </div>

                <div className="ig-post-media">
                  {post.images.length > 0 ? (
                    <div className="ig-carousel-container">
                      <div
                        className={`ig-carousel-track ${styles.carouselTrack}`}
                        style={
                          { '--tx': `translateX(-${activeIndex * 100}%)` } as React.CSSProperties
                        }
                      >
                        {post.images.map((img, idx) => (
                          <img key={idx} src={img} alt="" draggable="false" />
                        ))}
                      </div>
                      {post.images.length > 1 && (
                        <>
                          <button
                            className="ig-carousel-btn prev"
                            onClick={() => handlePrevImage(post.id, post.images.length)}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            className="ig-carousel-btn next"
                            onClick={() => handleNextImage(post.id, post.images.length)}
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="ig-post-text-only">{post.content}</div>
                  )}
                </div>

                <div className="ig-post-actions">
                  <div className="ig-actions-left">
                    <button
                      className={`ig-action-btn ${isLiked ? 'liked' : ''}`}
                      onClick={() => {
                        if (isLiked) handleReaction(post.id, userReaction!);
                        else setReactionPicker(reactionPicker === post.id ? null : post.id);
                      }}
                    >
                      {isLiked ? (
                        <Heart size={22} fill="#ff3040" color="#ff3040" />
                      ) : (
                        <Heart size={22} />
                      )}
                    </button>
                    {reactionPicker === post.id && (
                      <div className="ig-reaction-picker">
                        {Object.entries(reactionEmojis).map(([key, emoji]) => (
                          <button
                            key={key}
                            onClick={() => handleReaction(post.id, key)}
                            className="ig-reaction-option"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="ig-action-btn" onClick={() => setOpenComments(post.id)}>
                      <MessageCircle size={22} />
                    </button>
                    <button className="ig-action-btn">
                      <Send size={22} />
                    </button>
                  </div>
                  {post.images.length > 1 && (
                    <div className="ig-actions-center">
                      {post.images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`ig-dot ${activeIndex === idx ? 'active' : ''}`}
                          onClick={() => handleSetImageIndex(post.id, idx)}
                          className={styles.dotCursor}
                        />
                      ))}
                    </div>
                  )}
                  <button className="ig-action-btn">
                    <Bookmark size={22} />
                  </button>
                </div>

                <div className="ig-post-body">
                  <div className="ig-post-likes">
                    {post._count.reactions.toLocaleString()} Me gusta
                  </div>
                  <p className="ig-post-caption">
                    <strong>{post.user.socialProfile?.displayName || post.user.name}</strong>
                    {post.content}
                  </p>
                  <button
                    className="ig-post-comments-link"
                    onClick={() => setOpenComments(post.id)}
                  >
                    Ver los {post._count.comments} comentarios
                  </button>
                </div>
              </article>
            );
          })
        )}

        {page < totalPages && (
          <button
            className="ig-load-more"
            onClick={async () => {
              const next = page + 1;
              setPage(next);
              await loadFeed(next);
            }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        )}
        <div className="ig-scroll-indicator">
          <div className="ig-scroll-mouse" />
          <ChevronDown className="ig-scroll-arrow" size={16} />
          <ChevronDown className="ig-scroll-arrow" size={16} />
          <ChevronDown className="ig-scroll-arrow" size={16} />
        </div>
      </div>

      <aside className="ig-feed-sidebar">
        <div className="ig-suggestions">
          <div className="ig-suggestions-header">
            <span>Sugerencias para ti</span>
            <button>Ver todo</button>
          </div>
          <div className="ig-suggestion-item">
            <div className="ig-avatar-sm">M</div>
            <div className="ig-suggestion-info">
              <strong>mercado_libre</strong>
              <span>Seguidores: 12.5k</span>
            </div>
            <button className="ig-follow-btn">Seguir</button>
          </div>
          <div className="ig-suggestion-item">
            <div className="ig-avatar-sm">T</div>
            <div className="ig-suggestion-info">
              <strong>tienda_online</strong>
              <span>Seguidores: 8.2k</span>
            </div>
            <button className="ig-follow-btn">Seguir</button>
          </div>
        </div>
      </aside>

      {/* Sliding comments drawer */}
      <div
        className={`ig-comments-drawer-backdrop ${openComments ? 'active' : ''}`}
        onClick={() => setOpenComments(null)}
      />
      <div className={`ig-comments-drawer ${openComments ? 'active' : ''}`}>
        <div className="ig-drawer-handle" onClick={() => setOpenComments(null)} />
        <div className="ig-drawer-header">
          <h3>Comentarios</h3>
          <button className="ig-drawer-close" onClick={() => setOpenComments(null)}>
            &times;
          </button>
        </div>
        {openComments && (
          <div className="ig-drawer-content">
            <SocialComments postId={openComments} />
          </div>
        )}
      </div>
    </div>
  );
}

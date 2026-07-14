import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageCircle,
  Heart,
  User,
  Search,
  Home,
  ShoppingBag,
  PlusSquare,
  Send,
  ArrowLeft,
  Camera,
  ImageOff,
  Shuffle,
} from 'lucide-react';
import { Skeleton } from '@shared/ui/Skeleton';
import { SocialFeed } from '../../components/SocialFeed';
import { SocialCatalogs } from '../../components/SocialCatalogs';
import { SocialNotifications } from '../../components/SocialNotifications';
import { SocialMessages } from '../../components/SocialMessages';
import { SocialProfile } from '../../components/SocialProfile';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@shared/lib/http/client';
import styles from './SocialPage.module.css';

type SocialTab =
  'feed' | 'explore' | 'catalogs' | 'notifications' | 'messages' | 'profile' | 'create';

export function SocialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [tabHistory, setTabHistory] = useState<SocialTab[]>(['feed']);
  const [progress, setProgress] = useState(0);
  const pressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const navigateToTab = useCallback((tab: SocialTab) => {
    setActiveTab(tab);
    setTabHistory((prev) => {
      if (prev[prev.length - 1] === tab) return prev;
      return [...prev, tab];
    });
  }, []);

  const goBackTab = useCallback(() => {
    setTabHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      const prevTab = newHistory[newHistory.length - 1];
      setActiveTab(prevTab);
      return newHistory;
    });
  }, []);

  const handleStartPress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (activeTab !== 'feed') return;
      setProgress(0);
      const duration = 2500;
      const step = 50;
      const increment = (step / duration) * 100;
      let currentProgress = 0;

      if (pressTimer.current) clearInterval(pressTimer.current || undefined);

      pressTimer.current = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= 100) {
          clearInterval(pressTimer.current || undefined);
          pressTimer.current = null;
          setProgress(0);
          navigate('/dashboard');
        } else {
          setProgress(currentProgress);
        }
      }, step);
    },
    [activeTab, navigate]
  );

  const handleEndPress = useCallback(() => {
    if (pressTimer.current) {
      clearInterval(pressTimer.current || undefined);
      pressTimer.current = null;
    }
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearInterval(pressTimer.current || undefined);
      }
    };
  }, []);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [notifData, msgData] = await Promise.all([
          api.getUnreadNotificationCount().catch(() => ({ count: 0 })),
          api.getUnreadMessageCount().catch(() => ({ count: 0 })),
        ]);
        setUnreadNotifs(notifData.count || 0);
        setUnreadMessages(msgData.count || 0);
      } catch {}
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { key: 'feed' as SocialTab, icon: Home, label: 'Inicio' },
    { key: 'messages' as SocialTab, icon: MessageCircle, label: 'Mensajes', badge: unreadMessages },
    { key: 'create' as SocialTab, icon: PlusSquare, label: 'Crear' },
    { key: 'explore' as SocialTab, icon: Search, label: 'Explorar' },
    { key: 'notifications' as SocialTab, icon: Bell, label: 'Notificaciones', badge: unreadNotifs },
    { key: 'catalogs' as SocialTab, icon: ShoppingBag, label: 'Catálogo' },
    { key: 'profile' as SocialTab, icon: User, label: 'Perfil' },
  ];

  const mobileNav = [
    { key: 'feed' as SocialTab, icon: Home, label: 'Inicio' },
    { key: 'explore' as SocialTab, icon: Search, label: 'Buscar' },
    { key: 'create' as SocialTab, icon: PlusSquare, label: 'Crear' },
    {
      key: 'notifications' as SocialTab,
      icon: Heart,
      label: 'Notificaciones',
      badge: unreadNotifs,
    },
    { key: 'profile' as SocialTab, icon: User, label: 'Perfil' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <SocialFeed />;
      case 'explore':
        return <ExploreSection onSelectUser={() => navigateToTab('profile')} />;
      case 'catalogs':
        return <SocialCatalogs />;
      case 'notifications':
        return <SocialNotifications />;
      case 'messages':
        return <SocialMessages />;
      case 'create':
        return <CreatePostView onCreated={() => navigateToTab('feed')} />;
case 'profile':
          return <SocialProfile />;
      default:
        return <SocialFeed />;
    }
  };

  const handleNavClick = (tab: SocialTab) => {
    if (tab === 'create') {
      setShowCreatePostModal(true);
    } else {
      navigateToTab(tab);
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}></div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${activeTab === item.key ? styles.active : ''}`}
              onClick={() => handleNavClick(item.key)}
            >
              <item.icon size={22} strokeWidth={activeTab === item.key ? 2.5 : 1.5} />
              <span className={styles.navLabel}>{item.label}</span>
              {(item.badge ?? 0) > 0 && <span className={styles.badge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarUser}>
          <div className={styles.sidebarUserAvatar}>{(user?.name || 'U')[0].toUpperCase()}</div>
          <span className={styles.sidebarUserName}>{user?.name || 'Usuario'}</span>
        </div>
        <Link to="/dashboard" className={styles.sidebarBack} title="Volver al panel">
          <ArrowLeft size={18} />
          <span className={styles.navLabel}>Volver al panel</span>
        </Link>
      </aside>

      <header className={styles.mobileTop}>
        <div className={styles.mobileHeaderRow}>
          <div className={styles.mobileHeaderLeft}>
            {activeTab === 'feed' ? (
              <button
                className={styles.backBtn}
                title="Mantén presionado para volver al panel"
                onMouseDown={handleStartPress}
                onMouseUp={handleEndPress}
                onMouseLeave={handleEndPress}
                onTouchStart={handleStartPress}
                onTouchEnd={handleEndPress}
                onClick={(e) => e.preventDefault()}
                className={styles.backBtnRelative}
              >
                <ArrowLeft size={22} />
                {progress > 0 && (
                  <svg
                    className={`ig-longpress-progress ${styles.progressSvg}`}
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                  >
                    <circle
                      cx="15"
                      cy="15"
                      r="13"
                      fill="transparent"
                      stroke="var(--color-primary, var(--brand-orange))"
                      strokeWidth="2.5"
                      strokeDasharray="81.68"
                      strokeDashoffset={81.68 - (81.68 * progress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            ) : (
              tabHistory.length > 1 && (
                <button className={styles.backBtn} title="Atrás" onClick={goBackTab}>
                  <ArrowLeft size={22} />
                </button>
              )
            )}
          </div>
          <div className={styles.mobileTopActions}>
            <Send size={22} onClick={() => handleNavClick('messages')} />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.socialContentWrapper}>
          {tabHistory.length > 1 && (
            <button className={styles.feedHistoryBack} title="Atrás en Social" onClick={goBackTab}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div className={styles.socialContentInner}>{renderContent()}</div>
        </div>
      </main>

      <nav className={styles.mobileBottom}>
        <div className={styles.mobileNavRow}>
          {mobileNav.map((item) => (
            <button
              key={item.key}
              className={`${styles.mobileNavBtn} ${activeTab === item.key ? styles.active : ''}`}
              onClick={() => handleNavClick(item.key)}
            >
              <item.icon size={24} strokeWidth={activeTab === item.key ? 2.5 : 1.5} />
              {(item.badge ?? 0) > 0 && <span className={styles.badgeMobile}>{item.badge}</span>}
            </button>
          ))}
        </div>
        <div className="ig-mobile-home-indicator" />
      </nav>
      {showCreatePostModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreatePostModal(false)}>
          <div
            className={`${styles.modalContent} ${styles.createPostModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CreatePostView
              onCreated={() => {
                setShowCreatePostModal(false);
                if (activeTab === 'feed') {
                  window.location.reload();
                } else {
                  navigateToTab('feed');
                }
              }}
              onClose={() => setShowCreatePostModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePostView({ onCreated, onClose }: { onCreated: () => void; onClose?: () => void }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
    setError('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo imágenes');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImages((prev) => [...prev, reader.result as string]);
        setError('');
      }
    };
    reader.onerror = () => setError('Error al leer el archivo');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      await api.createSocialPost({ content, images });
      setContent('');
      setImages([]);
      setFailedImages(new Set());
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Error al crear la publicación');
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addImage();
  };

  const addTestImage = () => {
    const testUrl = `https://picsum.photos/seed/${Date.now()}/400/400`;
    setImages((prev) => [...prev, testUrl]);
    setError('');
  };

  return (
    <div className={styles.createView}>
      <div className={styles.createBox}>
        <div className={styles.createHeader}>
          <div className={styles.createHeaderLeft}>
            {onClose && (
              <button className={styles.createCloseBtn} onClick={onClose}>
                ×
              </button>
            )}
            <span>Crear publicación</span>
          </div>
          <button
            className={styles.btnPrimary}
            onClick={handleCreate}
            disabled={!content.trim() || posting}
          >
            {posting ? 'Compartiendo...' : 'Compartir'}
          </button>
        </div>
        <div className={styles.createBody}>
          <div className={styles.createDropzone} onClick={() => fileRef.current?.click()}>
            {images.length > 0 ? (
              <div className={styles.createPreviewGrid}>
                {images.map((img, i) => (
                  <div key={i} className="ig-preview-item">
                    {failedImages.has(img) ? (
                      <div className="ig-preview-fallback">
                        <ImageOff size={20} />
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt=""
                        onError={() => setFailedImages((prev) => new Set(prev).add(img))}
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImages((prev) => prev.filter((_, j) => j !== i));
                        setFailedImages((prev) => {
                          const s = new Set(prev);
                          s.delete(img);
                          return s;
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Camera className="ig-create-icon" size={48} />
                <p>Haz clic para subir un archivo o pega una URL</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInputHidden}
            onChange={handleFile}
          />
          <div className="ig-create-url-row">
            <input
              className="ig-create-url-input"
              type="text"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="ig-btn-secondary" onClick={addImage} disabled={!urlInput.trim()}>
              +
            </button>
            <button
              className="ig-btn-test"
              onClick={addTestImage}
              title="Probar con imagen aleatoria"
            >
              <Shuffle size={18} />
            </button>
          </div>
          {error && <div className="ig-create-error">{error}</div>}
          <div className="ig-create-form">
            <textarea
              placeholder="Escribe un pie de foto..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExploreSection({ onSelectUser }: { onSelectUser: (id: string) => void }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .searchSocialProfiles('')
      .then((r) => setProfiles(r || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) return;
    try {
      const results = await api.searchSocialProfiles(q);
      setProfiles(results || []);
    } catch {}
  };

  return (
    <div className="ig-explore">
      <div className="ig-explore-search">
        <Search size={16} />
        <input
          placeholder="Buscar"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="ig-explore-grid">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`ig-explore-card ${styles.exploreCard}`}>
                <Skeleton variant="circle" width={48} height={48} />
                <Skeleton height={10} width="60%" />
              </div>
            ))
          : profiles.map((p) => (
              <div key={p.id} className="ig-explore-card" onClick={() => onSelectUser(p.userId)}>
                <div className="ig-explore-avatar">
                  {(p.displayName || p.user?.name || '?')[0].toUpperCase()}
                </div>
                <strong>{p.displayName || p.user?.name}</strong>
              </div>
            ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Settings, UserPlus, UserCheck, MapPin, Link as LinkIcon, Grid, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@shared/ui/Skeleton';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@shared/lib/http/client';
import type { SocialProfile as SocialProfileType } from '@types';
import { SocialComments } from './SocialComments';

function ProfileSkeleton() {
  return (
    <div className="ig-profile" style={{ pointerEvents: 'none' }}>
      <div className="ig-profile-header">
        <div className="ig-profile-avatar-section">
          <Skeleton variant="circle" width={120} height={120} />
        </div>
        <div className="ig-profile-info">
          <Skeleton height={22} width={220} />
          <div style={{ display: 'flex', gap: 40, margin: '16px 0' }}>
            <Skeleton height={16} width={60} />
            <Skeleton height={16} width={60} />
            <Skeleton height={16} width={60} />
          </div>
          <Skeleton height={12} width="80%" />
          <Skeleton height={12} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
    </div>
  );
}

export function SocialProfileView({ targetUserId }: { targetUserId?: string }) {
  const { user } = useAuth();
  const isOwn = !targetUserId || targetUserId === user?.id;
  const [profile, setProfile] = useState<SocialProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [stats, setStats] = useState({ posts: 0, catalogs: 0 });
  const [activeTab, setActiveTab] = useState<'posts' | 'catalogs'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', location: '', website: '' });

  useEffect(() => { loadProfile(); }, [targetUserId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (isOwn) {
        const [p, s, f] = await Promise.all([
          api.getSocialProfile(),
          api.getSocialStats(),
          api.getFollowCounts(),
        ]);
        setProfile(p);
        setStats(s);
        setFollowCounts(f);
        setEditForm({ displayName: p.displayName || '', bio: p.bio || '', location: p.location || '', website: p.website || '' });
      } else {
        const [p, f] = await Promise.all([
          api.getSocialUserProfile(targetUserId!),
          api.isFollowing(targetUserId!),
        ]);
        setProfile(p);
        setIsFollowing(f.isFollowing);
      }
      if (targetUserId) {
        const postsData = await api.getUserPosts(targetUserId);
        setUserPosts(postsData.posts || []);
      } else {
        const postsData = await api.getFeed(1, 9);
        setUserPosts(postsData.posts || []);
      }
    } catch (err) {
      console.error('Error loading profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!targetUserId) return;
    try {
      const result = await api.toggleFollow(targetUserId);
      setIsFollowing(result.action === 'followed');
      setFollowCounts(prev => ({
        ...prev,
        followers: result.action === 'followed' ? prev.followers + 1 : Math.max(0, prev.followers - 1),
      }));
    } catch {}
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await api.updateSocialProfile(editForm);
      setProfile(updated);
      setEditing(false);
    } catch {}
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <div className="ig-loading">Perfil no encontrado</div>;

  return (
    <div className="ig-profile">
      {/* Profile Header */}
      <div className="ig-profile-header">
        <div className="ig-profile-avatar-section">
          <div className="ig-profile-avatar">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" />
            ) : (
              (profile.displayName || profile.user.name)[0].toUpperCase()
            )}
          </div>
        </div>
        <div className="ig-profile-info">
          <div className="ig-profile-name-row">
            <h2>{profile.displayName || profile.user.name}</h2>
            {isOwn ? (
              <button className="ig-profile-edit-btn" onClick={() => setEditing(!editing)}>
                <Settings size={18} /> Editar perfil
              </button>
            ) : (
              <button className={`ig-profile-follow-btn ${isFollowing ? 'following' : ''}`} onClick={handleToggleFollow}>
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>

          <div className="ig-profile-stats">
            <div className="ig-stat"><strong>{stats.posts}</strong> <span>publicaciones</span></div>
            <div className="ig-stat"><strong>{followCounts.followers}</strong> <span>seguidores</span></div>
            <div className="ig-stat"><strong>{followCounts.following}</strong> <span>seguidos</span></div>
          </div>

          {profile.bio && <p className="ig-profile-bio">{profile.bio}</p>}
          <div className="ig-profile-links">
            {profile.location && <span><MapPin size={14} /> {profile.location}</span>}
            {profile.website && <span><LinkIcon size={14} /> {profile.website}</span>}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && isOwn && (
        <div className="ig-profile-edit-form">
          <input value={editForm.displayName} onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Nombre" />
          <textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} placeholder="Bio" rows={3} />
          <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder="Ubicación" />
          <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} placeholder="Sitio web" />
          <div className="ig-profile-edit-actions">
            <button onClick={() => setEditing(false)}>Cancelar</button>
            <button className="ig-btn-primary" onClick={handleSaveProfile}>Guardar</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ig-profile-tabs">
        <button className={`ig-profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <Grid size={12} /> PUBLICACIONES
        </button>
        <button className={`ig-profile-tab ${activeTab === 'catalogs' ? 'active' : ''}`} onClick={() => setActiveTab('catalogs')}>
          <ShoppingBag size={12} /> CATÁLOGOS
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        <div className="ig-profile-grid">
          {userPosts.map((post: any) => (
            <div key={post.id} className="ig-profile-grid-item">
              {post.images?.[0] ? (
                <img src={post.images[0]} alt="" />
              ) : (
                <div className="ig-profile-grid-text">{post.content.substring(0, 50)}</div>
              )}
              <div className="ig-profile-grid-overlay">
                <span>❤️ {post._count?.reactions || 0}</span>
                <span>💬 {post._count?.comments || 0}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ig-profile-catalogs">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Catálogos del usuario</p>
        </div>
      )}
    </div>
  );
}

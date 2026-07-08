import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Profile ─────────────────────────────────────────────────────────────

  async getProfile(userId: string, tenantId: string) {
    const profile = await this.prisma.socialProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!profile) {
      return this.createProfile(userId, tenantId, { displayName: '' });
    }
    return profile;
  }

  async getProfileByUserId(targetUserId: string, tenantId: string) {
    const profile = await this.prisma.socialProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }

  async createProfile(userId: string, tenantId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.prisma.socialProfile.create({
      data: {
        userId,
        tenantId,
        displayName: data.displayName || user?.name || 'Usuario',
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        coverUrl: data.coverUrl,
        location: data.location,
        website: data.website,
        phone: data.phone,
        isPublic: data.isPublic ?? true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async updateProfile(userId: string, tenantId: string, data: any) {
    const profile = await this.prisma.socialProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return this.prisma.socialProfile.update({
      where: { userId },
      data: {
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        coverUrl: data.coverUrl,
        location: data.location,
        website: data.website,
        phone: data.phone,
        isPublic: data.isPublic,
      },
    });
  }

  async searchProfiles(query: string, tenantId: string, currentUserId: string) {
    return this.prisma.socialProfile.findMany({
      where: {
        tenantId,
        isPublic: true,
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { user: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      take: 20,
    });
  }

  // ── Posts ────────────────────────────────────────────────────────────────

  async createPost(tenantId: string, userId: string, data: any) {
    return this.prisma.socialPost.create({
      data: {
        tenantId,
        userId,
        content: data.content,
        images: data.images || [],
        videos: data.videos || [],
        tags: data.tags || [],
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
  }

  async getFeed(tenantId: string, userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const following = await this.prisma.socialFollow.findMany({
      where: { followerUserId: userId, tenantId },
      select: { followedUserId: true },
    });
    const followingIds = following.map(f => f.followedUserId);

    const posts = await this.prisma.socialPost.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { userId: { in: followingIds } },
          { userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            socialProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
        _count: { select: { comments: true, reactions: true } },
        reactions: { where: { userId }, select: { type: true } },
      },
    });

    const total = await this.prisma.socialPost.count({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { userId: { in: followingIds } },
          { userId },
        ],
      },
    });

    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPostById(id: string, tenantId: string) {
    const post = await this.prisma.socialPost.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            socialProfile: { select: { avatarUrl: true, displayName: true } },
          },
        },
        _count: { select: { comments: true, reactions: true } },
      },
    });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    return post;
  }

  async getUserPosts(userId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where: { userId, tenantId, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { comments: true, reactions: true } },
          reactions: { select: { type: true } },
        },
      }),
      this.prisma.socialPost.count({ where: { userId, tenantId, isActive: true } }),
    ]);
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updatePost(id: string, tenantId: string, userId: string, data: any) {
    const post = await this.prisma.socialPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (post.userId !== userId) throw new ForbiddenException('No puedes editar esta publicación');
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        content: data.content,
        images: data.images,
        videos: data.videos,
        tags: data.tags,
        isActive: data.isActive,
        isPinned: data.isPinned,
      },
    });
  }

  async deletePost(id: string, tenantId: string, userId: string) {
    const post = await this.prisma.socialPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    if (post.userId !== userId) throw new ForbiddenException('No puedes eliminar esta publicación');
    await this.prisma.socialPost.delete({ where: { id } });
    return { message: 'Publicación eliminada' };
  }

  // ── Catalogs ─────────────────────────────────────────────────────────────

  async createCatalog(tenantId: string, userId: string, data: any) {
    return this.prisma.socialCatalog.create({
      data: {
        tenantId,
        userId,
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        category: data.category,
        isPublic: data.isPublic ?? true,
        status: 'draft',
      },
      include: { items: true },
    });
  }

  async getCatalogs(tenantId: string, userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId, userId };
    if (status) where.status = status;

    const [catalogs, total] = await Promise.all([
      this.prisma.socialCatalog.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { items: true } },
        },
      }),
      this.prisma.socialCatalog.count({ where }),
    ]);
    return { catalogs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPublicCatalogs(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [catalogs, total] = await Promise.all([
      this.prisma.socialCatalog.findMany({
        where: { tenantId, isPublic: true, status: 'published' },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.socialCatalog.count({ where: { tenantId, isPublic: true, status: 'published' } }),
    ]);
    return { catalogs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getCatalogById(id: string, tenantId: string) {
    const catalog = await this.prisma.socialCatalog.findFirst({
      where: { id, tenantId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
      },
    });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    return catalog;
  }

  async updateCatalog(id: string, tenantId: string, userId: string, data: any) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes editar este catálogo');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.status === 'published') updateData.publishedAt = new Date();

    return this.prisma.socialCatalog.update({
      where: { id },
      data: updateData,
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async deleteCatalog(id: string, tenantId: string, userId: string) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes eliminar este catálogo');
    await this.prisma.socialCatalog.delete({ where: { id } });
    return { message: 'Catálogo eliminado' };
  }

  async publishCatalog(id: string, tenantId: string, userId: string) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes publicar este catálogo');

    return this.prisma.socialCatalog.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ── Catalog Items ────────────────────────────────────────────────────────

  async addCatalogItem(catalogId: string, tenantId: string, userId: string, data: any) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id: catalogId, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes modificar este catálogo');

    const maxOrder = await this.prisma.socialCatalogItem.aggregate({
      where: { catalogId },
      _max: { sortOrder: true },
    });

    return this.prisma.socialCatalogItem.create({
      data: {
        catalogId,
        tenantId,
        name: data.name,
        description: data.description,
        price: data.price ?? 0,
        imageUrl: data.imageUrl,
        category: data.category,
        link: data.link,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateCatalogItem(itemId: string, catalogId: string, tenantId: string, userId: string, data: any) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id: catalogId, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes modificar este catálogo');

    const item = await this.prisma.socialCatalogItem.findFirst({ where: { id: itemId, catalogId } });
    if (!item) throw new NotFoundException('Item no encontrado');

    return this.prisma.socialCatalogItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        category: data.category,
        link: data.link,
        sortOrder: data.sortOrder,
      },
    });
  }

  async deleteCatalogItem(itemId: string, catalogId: string, tenantId: string, userId: string) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id: catalogId, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes modificar este catálogo');

    await this.prisma.socialCatalogItem.delete({ where: { id: itemId } });
    return { message: 'Item eliminado' };
  }

  async reorderCatalogItems(catalogId: string, tenantId: string, userId: string, items: { id: string; sortOrder: number }[]) {
    const catalog = await this.prisma.socialCatalog.findFirst({ where: { id: catalogId, tenantId } });
    if (!catalog) throw new NotFoundException('Catálogo no encontrado');
    if (catalog.userId !== userId) throw new ForbiddenException('No puedes modificar este catálogo');

    const updates = items.map(item =>
      this.prisma.socialCatalogItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    );
    await Promise.all(updates);
    return { message: 'Items reordenados' };
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  async createComment(tenantId: string, userId: string, data: any) {
    if (!data.postId && !data.catalogId) {
      throw new BadRequestException('Debes especificar un postId o catalogId');
    }

    const comment = await this.prisma.socialComment.create({
      data: {
        tenantId,
        userId,
        postId: data.postId,
        catalogId: data.catalogId,
        parentId: data.parentId,
        content: data.content,
      },
      include: {
        user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
      },
    });

    if (data.parentId) {
      const parent = await this.prisma.socialComment.findUnique({ where: { id: data.parentId } });
      if (parent && parent.userId !== userId) {
        await this.createNotification(tenantId, parent.userId, userId, 'comment_reply', 'Nueva respuesta', `${comment.user.name} respondió a tu comentario`, '');
      }
    }

    if (data.postId) {
      const post = await this.prisma.socialPost.findUnique({ where: { id: data.postId } });
      if (post && post.userId !== userId) {
        await this.createNotification(tenantId, post.userId, userId, 'comment', 'Nuevo comentario', `${comment.user.name} comentó tu publicación`, `/social/post/${data.postId}`);
      }
    }

    if (data.catalogId) {
      const catalog = await this.prisma.socialCatalog.findUnique({ where: { id: data.catalogId } });
      if (catalog && catalog.userId !== userId) {
        await this.createNotification(tenantId, catalog.userId, userId, 'catalog_comment', 'Nuevo comentario en catálogo', `${comment.user.name} comentó tu catálogo`, `/social/catalog/${data.catalogId}`);
      }
    }

    return comment;
  }

  async getPostComments(postId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      this.prisma.socialComment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.socialComment.count({ where: { postId, parentId: null } }),
    ]);
    return { comments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getCatalogComments(catalogId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      this.prisma.socialComment.findMany({
        where: { catalogId, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true, displayName: true } } } },
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.socialComment.count({ where: { catalogId, parentId: null } }),
    ]);
    return { comments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deleteComment(id: string, tenantId: string, userId: string) {
    const comment = await this.prisma.socialComment.findFirst({ where: { id, tenantId } });
    if (!comment) throw new NotFoundException('Comentario no encontrado');
    if (comment.userId !== userId) throw new ForbiddenException('No puedes eliminar este comentario');
    await this.prisma.socialComment.delete({ where: { id } });
    return { message: 'Comentario eliminado' };
  }

  // ── Reactions ────────────────────────────────────────────────────────────

  async toggleReaction(tenantId: string, userId: string, data: any) {
    if (!data.postId && !data.commentId && !data.catalogId) {
      throw new BadRequestException('Debes especificar un postId, commentId o catalogId');
    }

    const existing = await this.prisma.socialReaction.findFirst({
      where: {
        tenantId,
        userId,
        postId: data.postId || null,
        commentId: data.commentId || null,
        catalogId: data.catalogId || null,
      },
    });

    if (existing) {
      if (existing.type === (data.type || 'like')) {
        await this.prisma.socialReaction.delete({ where: { id: existing.id } });
        return { action: 'removed', type: data.type || 'like' };
      }
      await this.prisma.socialReaction.update({
        where: { id: existing.id },
        data: { type: data.type || 'like' },
      });
      return { action: 'updated', type: data.type || 'like' };
    }

    const reaction = await this.prisma.socialReaction.create({
      data: {
        tenantId,
        userId,
        postId: data.postId,
        commentId: data.commentId,
        catalogId: data.catalogId,
        type: data.type || 'like',
      },
    });

    if (data.postId) {
      const post = await this.prisma.socialPost.findUnique({ where: { id: data.postId } });
      if (post && post.userId !== userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        await this.createNotification(tenantId, post.userId, userId, 'like', 'Nuevo like', `A ${user?.name || 'Alguien'} le gustó tu publicación`, `/social/post/${data.postId}`);
      }
    }
    if (data.catalogId) {
      const catalog = await this.prisma.socialCatalog.findUnique({ where: { id: data.catalogId } });
      if (catalog && catalog.userId !== userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        await this.createNotification(tenantId, catalog.userId, userId, 'catalog_like', 'Nuevo like en catálogo', `A ${user?.name || 'Alguien'} le gustó tu catálogo`, `/social/catalog/${data.catalogId}`);
      }
    }

    return { action: 'created', type: data.type || 'like', reaction };
  }

  async getReactions(postId?: string, commentId?: string, catalogId?: string) {
    const where: any = {};
    if (postId) where.postId = postId;
    if (commentId) where.commentId = commentId;
    if (catalogId) where.catalogId = catalogId;

    const reactions = await this.prisma.socialReaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true } } } },
      },
    });

    const counts: Record<string, number> = {};
    reactions.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });

    return { reactions, counts, total: reactions.length };
  }

  // ── Follows ──────────────────────────────────────────────────────────────

  async toggleFollow(tenantId: string, followerUserId: string, followedUserId: string) {
    if (followerUserId === followedUserId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    const existing = await this.prisma.socialFollow.findUnique({
      where: {
        tenantId_followerUserId_followedUserId: {
          tenantId,
          followerUserId,
          followedUserId,
        },
      },
    });

    if (existing) {
      await this.prisma.socialFollow.delete({ where: { id: existing.id } });
      return { action: 'unfollowed' };
    }

    await this.prisma.socialFollow.create({
      data: { tenantId, followerUserId, followedUserId },
    });

    const user = await this.prisma.user.findUnique({ where: { id: followerUserId } });
    await this.createNotification(tenantId, followedUserId, followerUserId, 'follow', 'Nuevo seguidor', `${user?.name || 'Alguien'} comenzó a seguirte`, '');

    return { action: 'followed' };
  }

  async getFollowers(userId: string, tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [followers, total] = await Promise.all([
      this.prisma.socialFollow.findMany({
        where: { followedUserId: userId, tenantId },
        skip,
        take: limit,
        include: {
          followerUser: {
            select: {
              id: true,
              name: true,
              socialProfile: { select: { avatarUrl: true, displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.socialFollow.count({ where: { followedUserId: userId, tenantId } }),
    ]);
    return { followers, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getFollowing(userId: string, tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [following, total] = await Promise.all([
      this.prisma.socialFollow.findMany({
        where: { followerUserId: userId, tenantId },
        skip,
        take: limit,
        include: {
          followedUser: {
            select: {
              id: true,
              name: true,
              socialProfile: { select: { avatarUrl: true, displayName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.socialFollow.count({ where: { followerUserId: userId, tenantId } }),
    ]);
    return { following, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getFollowCounts(userId: string, tenantId: string) {
    const [followers, following] = await Promise.all([
      this.prisma.socialFollow.count({ where: { followedUserId: userId, tenantId } }),
      this.prisma.socialFollow.count({ where: { followerUserId: userId, tenantId } }),
    ]);
    return { followers, following };
  }

  async isFollowing(followerUserId: string, followedUserId: string, tenantId: string) {
    const follow = await this.prisma.socialFollow.findUnique({
      where: {
        tenantId_followerUserId_followedUserId: {
          tenantId,
          followerUserId,
          followedUserId,
        },
      },
    });
    return { isFollowing: !!follow };
  }

  // ── Notifications ────────────────────────────────────────────────────────

  private async createNotification(tenantId: string, userId: string, fromUserId: string, type: string, title: string, message: string, link: string) {
    return this.prisma.socialNotification.create({
      data: { tenantId, userId, fromUserId, type, title, message, link },
    });
  }

  async getNotifications(userId: string, tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.socialNotification.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          fromUser: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true } } } },
        },
      }),
      this.prisma.socialNotification.count({ where: { userId, tenantId } }),
      this.prisma.socialNotification.count({ where: { userId, tenantId, isRead: false } }),
    ]);
    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  }

  async markNotificationRead(id: string, userId: string) {
    const notification = await this.prisma.socialNotification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.socialNotification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllNotificationsRead(userId: string, tenantId: string) {
    await this.prisma.socialNotification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  async getUnreadNotificationCount(userId: string) {
    const count = await this.prisma.socialNotification.count({ where: { userId, isRead: false } });
    return { count };
  }

  // ── Messages ─────────────────────────────────────────────────────────────

  async createThread(tenantId: string, userId: string, data: any) {
    if (!data.memberIds.includes(userId)) {
      data.memberIds.push(userId);
    }

    const thread = await this.prisma.socialThread.create({
      data: {
        tenantId,
        title: data.title,
        isGroup: data.memberIds.length > 2,
        members: {
          create: data.memberIds.map((memberId: string) => ({
            userId: memberId,
          })),
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true } } } } },
        },
      },
    });
    return thread;
  }

  async getUserThreads(userId: string, tenantId: string) {
    const memberships = await this.prisma.socialThreadMember.findMany({
      where: { userId },
      include: {
        thread: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true } } } } },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            _count: { select: { messages: true } },
          },
        },
      },
      orderBy: { thread: { updatedAt: 'desc' } },
    });

    return memberships.map(m => ({
      ...m.thread,
      lastMessage: m.thread.messages[0] || null,
      unreadCount: 0,
      members: m.thread.members,
      messages: undefined,
      _count: m.thread._count,
    }));
  }

  async sendMessage(tenantId: string, senderId: string, data: any) {
    let threadId = data.threadId;

    if (!threadId && data.recipientId) {
      const existingThread = await this.findDirectMessageThread(tenantId, senderId, data.recipientId);
      if (existingThread) {
        threadId = existingThread.id;
      } else {
        const thread = await this.createThread(tenantId, senderId, { memberIds: [senderId, data.recipientId] });
        threadId = thread.id;
      }
    }

    if (!threadId) {
      throw new BadRequestException('Debes especificar un threadId o recipientId');
    }

    const message = await this.prisma.socialMessage.create({
      data: {
        threadId,
        senderId,
        tenantId,
        content: data.content,
        images: data.images || [],
      },
      include: {
        sender: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true } } } },
      },
    });

    await this.prisma.socialThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

    const members = await this.prisma.socialThreadMember.findMany({ where: { threadId, userId: { not: senderId } } });
    for (const member of members) {
      const user = await this.prisma.user.findUnique({ where: { id: senderId } });
      await this.createNotification(tenantId, member.userId, senderId, 'message', 'Nuevo mensaje', `${user?.name || 'Alguien'} te envió un mensaje`, '/social/messages');
    }

    return message;
  }

  private async findDirectMessageThread(tenantId: string, userId1: string, userId2: string) {
    const threads1 = await this.prisma.socialThreadMember.findMany({
      where: { userId: userId1 },
      select: { threadId: true },
    });
    const threads2 = await this.prisma.socialThreadMember.findMany({
      where: { userId: userId2 },
      select: { threadId: true },
    });

    const threadIds1 = new Set(threads1.map(t => t.threadId));
    const common = threads2.filter(t => threadIds1.has(t.threadId)).map(t => t.threadId);

    if (common.length === 0) return null;

    for (const threadId of common) {
      const thread = await this.prisma.socialThread.findUnique({
        where: { id: threadId },
        include: { members: true },
      });
      if (thread && !thread.isGroup && thread.members.length === 2) {
        return thread;
      }
    }
    return null;
  }

  async getThreadMessages(threadId: string, userId: string, tenantId: string, page = 1, limit = 50) {
    const member = await this.prisma.socialThreadMember.findFirst({
      where: { threadId, userId },
    });
    if (!member) throw new ForbiddenException('No eres miembro de este hilo');

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.socialMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, name: true, socialProfile: { select: { avatarUrl: true } } } },
        },
      }),
      this.prisma.socialMessage.count({ where: { threadId } }),
    ]);

    await this.prisma.socialThreadMember.update({
      where: { threadId_userId: { threadId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { messages: messages.reverse(), total, page, totalPages: Math.ceil(total / limit) };
  }

  async markThreadAsRead(threadId: string, userId: string) {
    await this.prisma.socialThreadMember.update({
      where: { threadId_userId: { threadId, userId } },
      data: { lastReadAt: new Date() },
    });

    await this.prisma.socialMessage.updateMany({
      where: { threadId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Hilo marcado como leído' };
  }

  async getUnreadMessageCount(userId: string) {
    const memberships = await this.prisma.socialThreadMember.findMany({
      where: { userId },
      include: {
        thread: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    let unreadCount = 0;
    for (const m of memberships) {
      const lastMsg = m.thread.messages[0];
      if (lastMsg && lastMsg.senderId !== userId && !lastMsg.isRead) {
        unreadCount++;
      }
      if (lastMsg && lastMsg.senderId !== userId && m.lastReadAt && lastMsg.createdAt > m.lastReadAt) {
        unreadCount++;
      }
    }

    return { count: unreadCount };
  }

  // ── Dashboard stats ──────────────────────────────────────────────────────

  async getUserStats(userId: string, tenantId: string) {
    const [posts, catalogs, followers, following] = await Promise.all([
      this.prisma.socialPost.count({ where: { userId, tenantId, isActive: true } }),
      this.prisma.socialCatalog.count({ where: { userId, tenantId } }),
      this.prisma.socialFollow.count({ where: { followedUserId: userId, tenantId } }),
      this.prisma.socialFollow.count({ where: { followerUserId: userId, tenantId } }),
    ]);
    return { posts, catalogs, followers, following };
  }
}

import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { SocialService } from '../social.service';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { CreatePostDto, UpdatePostDto } from '../dto/social-post.dto';
import { CreateCatalogDto, UpdateCatalogDto, AddCatalogItemDto, UpdateCatalogItemDto, ReorderCatalogItemsDto } from '../dto/social-catalog.dto';
import { CreateCommentDto } from '../dto/social-comment.dto';
import { CreateReactionDto } from '../dto/social-reaction.dto';
import { UpdateProfileDto } from '../dto/social-profile.dto';
import { SendMessageDto, CreateThreadDto } from '../dto/social-message.dto';

@Controller('social')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'gerente', 'vendedor', 'cajero')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ── Profile ──────────────────────────────────────────────────────────────

  @Get('profile')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getProfile(user.id, user.tenantId);
  }

  @Patch('profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.updateProfile(user.id, user.tenantId, dto);
  }

  @Get('profile/:userId')
  async getUserProfile(@Param('userId') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getProfileByUserId(userId, user.tenantId);
  }

  @Get('profiles/search')
  async searchProfiles(@Query('q') query: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.searchProfiles(query || '', user.tenantId, user.id);
  }

  @Get('stats')
  async getUserStats(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getUserStats(user.id, user.tenantId);
  }

  // ── Posts ────────────────────────────────────────────────────────────────

  @Post('posts')
  async createPost(@Body() dto: CreatePostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.createPost(user.tenantId, user.id, dto);
  }

  @Get('feed')
  async getFeed(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.getFeed(user.tenantId, user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getPostById(id, user.tenantId);
  }

  @Get('users/:userId/posts')
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.getUserPosts(userId, user.tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Patch('posts/:id')
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.updatePost(id, user.tenantId, user.id, dto);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.deletePost(id, user.tenantId, user.id);
  }

  // ── Catalogs ─────────────────────────────────────────────────────────────

  @Post('catalogs')
  async createCatalog(@Body() dto: CreateCatalogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.createCatalog(user.tenantId, user.id, dto);
  }

  @Get('catalogs')
  async getCatalogs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.getCatalogs(user.tenantId, user.id, Number(page) || 1, Number(limit) || 20, status);
  }

  @Get('catalogs/public')
  async getPublicCatalogs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.getPublicCatalogs(user.tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('catalogs/:id')
  async getCatalog(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getCatalogById(id, user.tenantId);
  }

  @Patch('catalogs/:id')
  async updateCatalog(@Param('id') id: string, @Body() dto: UpdateCatalogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.updateCatalog(id, user.tenantId, user.id, dto);
  }

  @Delete('catalogs/:id')
  async deleteCatalog(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.deleteCatalog(id, user.tenantId, user.id);
  }

  @Post('catalogs/:id/publish')
  async publishCatalog(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.publishCatalog(id, user.tenantId, user.id);
  }

  // ── Catalog Items ────────────────────────────────────────────────────────

  @Post('catalogs/:catalogId/items')
  async addCatalogItem(@Param('catalogId') catalogId: string, @Body() dto: AddCatalogItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.addCatalogItem(catalogId, user.tenantId, user.id, dto);
  }

  @Patch('catalogs/:catalogId/items/:itemId')
  async updateCatalogItem(
    @Param('catalogId') catalogId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCatalogItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.updateCatalogItem(itemId, catalogId, user.tenantId, user.id, dto);
  }

  @Delete('catalogs/:catalogId/items/:itemId')
  async deleteCatalogItem(
    @Param('catalogId') catalogId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.deleteCatalogItem(itemId, catalogId, user.tenantId, user.id);
  }

  @Post('catalogs/:catalogId/items/reorder')
  async reorderCatalogItems(
    @Param('catalogId') catalogId: string,
    @Body() dto: ReorderCatalogItemsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.reorderCatalogItems(catalogId, user.tenantId, user.id, dto.items);
  }

  // ── Comments ─────────────────────────────────────────────────────────────

  @Post('comments')
  async createComment(@Body() dto: CreateCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.createComment(user.tenantId, user.id, dto);
  }

  @Get('posts/:postId/comments')
  async getPostComments(@Param('postId') postId: string, @Query('page') page: string, @Query('limit') limit: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getPostComments(postId, user.tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('catalogs/:catalogId/comments')
  async getCatalogComments(@Param('catalogId') catalogId: string, @Query('page') page: string, @Query('limit') limit: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getCatalogComments(catalogId, user.tenantId, Number(page) || 1, Number(limit) || 20);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.deleteComment(id, user.tenantId, user.id);
  }

  // ── Reactions ────────────────────────────────────────────────────────────

  @Post('reactions')
  async toggleReaction(@Body() dto: CreateReactionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.toggleReaction(user.tenantId, user.id, dto);
  }

  @Get('reactions')
  async getReactions(
    @Query('postId') postId: string,
    @Query('commentId') commentId: string,
    @Query('catalogId') catalogId: string,
  ) {
    return this.socialService.getReactions(postId, commentId, catalogId);
  }

  // ── Follows ──────────────────────────────────────────────────────────────

  @Post('follow/:userId')
  async toggleFollow(@Param('userId') followedUserId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.toggleFollow(user.tenantId, user.id, followedUserId);
  }

  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string, @Query('page') page: string, @Query('limit') limit: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getFollowers(userId, user.tenantId, Number(page) || 1, Number(limit) || 50);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string, @Query('page') page: string, @Query('limit') limit: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getFollowing(userId, user.tenantId, Number(page) || 1, Number(limit) || 50);
  }

  @Get('follow/:userId/status')
  async isFollowing(@Param('userId') followedUserId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.isFollowing(user.id, followedUserId, user.tenantId);
  }

  @Get('follow/counts')
  async getFollowCounts(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getFollowCounts(user.id, user.tenantId);
  }

  // ── Notifications ────────────────────────────────────────────────────────

  @Get('notifications')
  async getNotifications(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.getNotifications(user.id, user.tenantId, Number(page) || 1, Number(limit) || 50);
  }

  @Get('notifications/unread-count')
  async getUnreadNotificationCount(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getUnreadNotificationCount(user.id);
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.markNotificationRead(id, user.id);
  }

  @Post('notifications/read-all')
  async markAllNotificationsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.markAllNotificationsRead(user.id, user.tenantId);
  }

  // ── Messages ─────────────────────────────────────────────────────────────

  @Post('threads')
  async createThread(@Body() dto: CreateThreadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.createThread(user.tenantId, user.id, dto);
  }

  @Get('threads')
  async getUserThreads(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getUserThreads(user.id, user.tenantId);
  }

  @Post('messages')
  async sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.sendMessage(user.tenantId, user.id, dto);
  }

  @Get('threads/:threadId/messages')
  async getThreadMessages(
    @Param('threadId') threadId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.socialService.getThreadMessages(threadId, user.id, user.tenantId, Number(page) || 1, Number(limit) || 50);
  }

  @Post('threads/:threadId/read')
  async markThreadAsRead(@Param('threadId') threadId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.socialService.markThreadAsRead(threadId, user.id);
  }

  @Get('messages/unread-count')
  async getUnreadMessageCount(@CurrentUser() user: AuthenticatedUser) {
    return this.socialService.getUnreadMessageCount(user.id);
  }
}

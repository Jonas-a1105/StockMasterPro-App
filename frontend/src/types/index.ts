export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  categoryId: string | null;
  isActive: boolean;
  profitMargin: number;
  isLowStock: boolean;
  imageUrl?: string | null;
  brand?: string | null;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface ProcessSaleInput {
  items: SaleItemInput[];
  paymentMethod: 'cash' | 'card' | 'credit' | 'transfer';
  discount?: number;
  taxRate?: number;
  customerId?: string;
}

export interface Sale {
  id: string;
  tenantId: string;
  userId: string;
  customerId: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  items: SaleItemResponse[];
  createdAt: string;
}

export interface SaleItemResponse {
  productId: string;
  quantity: number;
  price: number;
  cost: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount?: number;
  taxRate?: number;
}

export interface Supplier {
  id: string; tenantId: string; name: string; contact: string | null;
  phone: string | null; email: string | null; address: string | null;
  createdAt: string; updatedAt: string;
}

export interface PurchaseOrder {
  id: string; tenantId: string; supplierId: string | null; userId: string;
  status: string; total: number; notes: string | null;
  approvedById: string | null; approvedAt: string | null;
  rejectedById: string | null; rejectedAt: string | null; rejectionReason: string | null;
  cancelledById: string | null; cancelledAt: string | null; cancellationReason: string | null;
  expectedDeliveryDate: string | null;
  items: PurchaseOrderItem[]; createdAt: string;
}

export interface PurchaseOrderItem {
  id: string; productId: string; quantity: number; receivedQty: number;
  cost: number; subtotal: number;
}

export interface InventoryMovement {
  id: string; productId: string; type: string; quantity: number;
  reference: string | null; notes: string | null; userId: string; createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'admin' | 'gerente' | 'cajero';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseInfo {
  code: string;
  expiresIn: string;
}

export interface LicenseActivationResult {
  message: string;
  expiresAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  color: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ── Social Types ──────────────────────────────────────────────────────────

export interface SocialProfile {
  id: string;
  userId: string;
  tenantId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  isPublic: boolean;
  user: { id: string; name: string; email?: string; role?: string };
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  tenantId: string;
  userId: string;
  content: string;
  images: string[];
  videos: string[];
  tags: string[];
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; socialProfile?: { avatarUrl: string | null; displayName: string } };
  _count: { comments: number; reactions: number };
  reactions?: { type: string }[];
  userReaction?: string | null;
}

export interface SocialCatalog {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  category: string | null;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  items: SocialCatalogItem[];
  user?: { id: string; name: string; socialProfile?: { avatarUrl: string | null; displayName: string } };
  _count?: { items: number };
}

export interface SocialCatalogItem {
  id: string;
  catalogId: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  link: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialComment {
  id: string;
  tenantId: string;
  userId: string;
  postId: string | null;
  catalogId: string | null;
  parentId: string | null;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; socialProfile?: { avatarUrl: string | null; displayName: string } };
  replies?: SocialComment[];
  _count?: { replies: number };
}

export interface SocialReaction {
  id: string;
  tenantId: string;
  userId: string;
  postId: string | null;
  commentId: string | null;
  catalogId: string | null;
  type: string;
  createdAt: string;
  user?: { id: string; name: string; socialProfile?: { avatarUrl: string | null } };
}

export interface SocialFollow {
  id: string;
  tenantId: string;
  followerUserId: string;
  followedUserId: string;
  createdAt: string;
  followerUser?: { id: string; name: string; socialProfile?: { avatarUrl: string | null; displayName: string } };
  followedUser?: { id: string; name: string; socialProfile?: { avatarUrl: string | null; displayName: string } };
}

export interface SocialNotification {
  id: string;
  tenantId: string;
  userId: string;
  fromUserId: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  fromUser: { id: string; name: string; socialProfile?: { avatarUrl: string | null } };
}

export interface SocialThread {
  id: string;
  tenantId: string;
  title: string | null;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  members: SocialThreadMember[];
  lastMessage?: SocialMessage | null;
  unreadCount?: number;
  _count?: { messages: number };
}

export interface SocialThreadMember {
  id: string;
  threadId: string;
  userId: string;
  lastReadAt: string | null;
  joinedAt: string;
  user: { id: string; name: string; socialProfile?: { avatarUrl: string | null } };
}

export interface SocialMessage {
  id: string;
  threadId: string;
  senderId: string;
  tenantId: string;
  content: string;
  images: string[];
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; name: string; socialProfile?: { avatarUrl: string | null } };
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  data?: T[];
}

export interface FeedResponse extends PaginatedResponse<SocialPost> {
  posts: SocialPost[];
}

export interface CatalogListResponse extends PaginatedResponse<SocialCatalog> {
  catalogs: SocialCatalog[];
}

export interface CommentsResponse extends PaginatedResponse<SocialComment> {
  comments: SocialComment[];
}

export interface ReactionsResponse {
  reactions: SocialReaction[];
  counts: Record<string, number>;
  total: number;
}

export interface FollowersResponse extends PaginatedResponse<SocialFollow> {
  followers: SocialFollow[];
}

export interface FollowingResponse extends PaginatedResponse<SocialFollow> {
  following: SocialFollow[];
}

export interface NotificationsResponse extends PaginatedResponse<SocialNotification> {
  notifications: SocialNotification[];
  unreadCount: number;
}

export interface MessagesResponse extends PaginatedResponse<SocialMessage> {
  messages: SocialMessage[];
}

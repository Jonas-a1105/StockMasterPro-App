const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async get<T = any>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T = any>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  async put<T = any>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
  }

  async patch<T = any>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }

  async delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 402) {
      window.dispatchEvent(new Event('license-blocked'));
      throw new Error('LICENSE_BLOCKED');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error de conexión' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    return response.json();
  }

  // Auth
  register(data: { tenantName: string; email: string; password: string; name: string }) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  login(data: { email: string; password: string }) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  // Inventory
  getProducts() {
    return this.request<any[]>('/inventory');
  }

  getProduct(id: string) {
    return this.request<any>(`/inventory/${id}`);
  }

  createProduct(data: any) {
    return this.request<any>('/inventory', { method: 'POST', body: JSON.stringify(data) });
  }

  updateProduct(id: string, data: any) {
    return this.request<any>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteProduct(id: string) {
    return this.request<void>(`/inventory/${id}`, { method: 'DELETE' });
  }

  // Sales
  processSale(data: any) {
    return this.request<any>('/sales', { method: 'POST', body: JSON.stringify(data) });
  }

  getSales(limit = 100) {
    return this.request<any[]>(`/sales?limit=${limit}`);
  }

  getDailySummary() {
    return this.request<{ total: number; count: number }>('/sales/daily-summary');
  }

  getSale(id: string) {
    return this.request<any>(`/sales/${id}`);
  }

  // Suppliers
  getSuppliers() { return this.request<any[]>('/suppliers'); }
  createSupplier(data: any) { return this.request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }); }
  updateSupplier(id: string, data: any) { return this.request<any>(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  deleteSupplier(id: string) { return this.request<void>(`/suppliers/${id}`, { method: 'DELETE' }); }

  // Purchase Orders
  getPurchaseOrders() { return this.request<any[]>('/purchase-orders'); }
  createPurchaseOrder(data: any) { return this.request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }); }

  // Inventory Adjustments
  adjustStock(id: string, data: any) { return this.request<any>(`/inventory/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }); }
  async getAdjustments(params?: { limit?: number; offset?: number }): Promise<any> {
    const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/inventory/adjustments${q}`);
  }

  // Inventory Movements (Kardex)
  getMovements(id: string) { return this.request<any[]>(`/inventory/${id}/movements`); }

  // Users (Admin)
  getUsers() { return this.request<any[]>('/users'); }
  getUser(id: string) { return this.request<any>(`/users/${id}`); }
  createUser(data: { email: string; password: string; name: string; role?: string }) {
    return this.request<any>('/users', { method: 'POST', body: JSON.stringify(data) });
  }
  updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
  deleteUser(id: string) { return this.request<void>(`/users/${id}`, { method: 'DELETE' }); }

  // Licenses
  getLicenseStatus() {
    return this.request<{ tier: string; status: string; expiresAt: string; activatedAt: string; isBlocked: boolean }>('/licenses/status');
  }
  getLicenseUsage() {
    return this.request<any>('/licenses/usage');
  }
  createSubscription(planType: string) {
    return this.request<{ subscriptionId: string; clientSecret: string; planType: string }>('/licenses/create-subscription', {
      method: 'POST',
      body: JSON.stringify({ planType }),
    });
  }
  getCustomerPortalSession() {
    return this.request<{ url: string }>('/licenses/customer-portal', {
      method: 'POST',
    });
  }
  upgradePlan(planType: string) {
    return this.request<{ message: string; planType: string }>('/licenses/upgrade', { method: 'POST', body: JSON.stringify({ planType }) });
  }
  generateLicense(data: { days: number; tier?: string; targetTenantId?: string }) {
    return this.request<{ code: string; expiresIn: string }>('/licenses/generate', { method: 'POST', body: JSON.stringify(data) });
  }
  activateLicense(code: string) {
    return this.request<{ message: string; expiresAt: string }>('/licenses/activate', { method: 'POST', body: JSON.stringify({ code }) });
  }
  cancelSubscription() {
    return this.request<{ message: string }>('/licenses/cancel', { method: 'POST' });
  }
  reactivateLicense() {
    return this.request<{ message: string; expiresAt: string }>('/licenses/reactivate', { method: 'POST' });
  }

  // Customers
  getCustomers() { return this.request<any[]>('/customers'); }
  getCustomer(id: string) { return this.request<any>(`/customers/${id}`); }
  createCustomer(data: any) { return this.request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }); }
  updateCustomer(id: string, data: any) { return this.request<any>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  deleteCustomer(id: string) { return this.request<void>(`/customers/${id}`, { method: 'DELETE' }); }
  payCustomerCredit(id: string, amount: number) { return this.request<any>(`/customers/${id}/pay`, { method: 'POST', body: JSON.stringify({ amount }) }); }

  // Categories
  getCategories() { return this.request<any[]>('/categories'); }
  createCategory(data: { name: string }) { return this.request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }); }
  updateCategory(id: string, data: { name: string }) { return this.request<any>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  deleteCategory(id: string) { return this.request<void>(`/categories/${id}`, { method: 'DELETE' }); }

  // Accounts Payable
  async getAccountsPayable(): Promise<any> {
    return this.request<any[]>('/accounts-payable');
  }
  async getAccountsPayableById(id: string): Promise<any> {
    return this.request<any>(`/accounts-payable/${id}`);
  }
  async createAccountsPayable(data: any): Promise<any> {
    return this.request<any>('/accounts-payable', { method: 'POST', body: JSON.stringify(data) });
  }
  async payAccountsPayable(data: any): Promise<any> {
    return this.request<any>('/accounts-payable/pay', { method: 'POST', body: JSON.stringify(data) });
  }
  async getPayablePayments(id: string): Promise<any> {
    return this.request<any[]>(`/accounts-payable/${id}/payments`);
  }

  // Expenses
  async getExpenses(params?: { category?: string; startDate?: string; endDate?: string }): Promise<any> {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/expenses${query}`);
  }
  async createExpense(data: any): Promise<any> {
    return this.request('/expenses', { method: 'POST', body: JSON.stringify(data) });
  }
  async deleteExpense(id: string): Promise<any> {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Credit Notes
  async getCreditNotes(): Promise<any> {
    return this.request('/credit-notes');
  }
  async getCreditNote(id: string): Promise<any> {
    return this.request(`/credit-notes/${id}`);
  }
  async createCreditNote(data: any): Promise<any> {
    return this.request('/credit-notes', { method: 'POST', body: JSON.stringify(data) });
  }

  // Warehouses
  async getWarehouses(): Promise<any> {
    return this.get('/warehouses');
  }
  async createWarehouse(data: { name: string; code: string; address?: string }): Promise<any> {
    return this.post('/warehouses', data);
  }
  async updateWarehouse(id: string, data: any): Promise<any> {
    return this.put(`/warehouses/${id}`, data);
  }
  async deleteWarehouse(id: string): Promise<any> {
    return this.delete(`/warehouses/${id}`);
  }

  // Reports
  async getNetProfit(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/reports/net-profit${query}`);
  }
  async getMonthlyProfit(year?: number): Promise<any> {
    const query = year ? `?year=${year}` : '';
    return this.request(`/reports/monthly-profit${query}`);
  }
  async getBestSellers(params?: { limit?: number; startDate?: string; endDate?: string }): Promise<any> {
    const filtered: Record<string, string> = {};
    if (params) {
      if (params.limit !== undefined) filtered.limit = String(params.limit);
      if (params.startDate) filtered.startDate = params.startDate;
      if (params.endDate) filtered.endDate = params.endDate;
    }
    const q = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return this.request(`/reports/best-sellers${q}`);
  }
  async getDeadProducts(params?: { days?: number }): Promise<any> {
    const q = params?.days !== undefined ? `?days=${params.days}` : '';
    return this.request(`/reports/dead-products${q}`);
  }

  // Exchange Rate
  async getDolarRate(): Promise<{ rate: number; updatedAt: string }> {
    return this.request('/exchange-rate/dolar');
  }

  // Bulk sync
  syncSales(data: any[]) {
    return this.request<any>('/sales/bulk', { method: 'POST', body: JSON.stringify({ sales: data }) });
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    return this.get('/notifications');
  }

  // Admin / Tenants
  async getAdminTenants(): Promise<any[]> {
    return this.get('/admin/tenants');
  }
  async blockTenant(id: string): Promise<any> {
    return this.post(`/admin/tenants/${id}/block`, {});
  }
  async unblockTenant(id: string): Promise<any> {
    return this.post(`/admin/tenants/${id}/unblock`, {});
  }
  async extendTenantLicense(id: string, days: number): Promise<any> {
    return this.post(`/admin/tenants/${id}/extend`, { days });
  }
  async changeTenantPlan(id: string, planType: string): Promise<any> {
    return this.post(`/admin/tenants/${id}/plan`, { planType });
  }

  // Events
  async getEvents(params?: { start?: string; end?: string }): Promise<any[]> {
    const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/events${q}`);
  }
  async createEvent(data: {
    title: string; description?: string; startDate: string;
    endDate?: string; allDay?: boolean; color?: string;
  }): Promise<any> {
    return this.post('/events', data);
  }
  async updateEvent(id: string, data: any): Promise<any> {
    return this.put(`/events/${id}`, data);
  }
  async deleteEvent(id: string): Promise<any> {
    return this.delete(`/events/${id}`);
  }

  // ── Social ──────────────────────────────────────────────────────────────

  // Profile
  async getSocialProfile(): Promise<any> { return this.get('/social/profile'); }
  async updateSocialProfile(data: any): Promise<any> { return this.patch('/social/profile', data); }
  async getSocialUserProfile(userId: string): Promise<any> { return this.get(`/social/profile/${userId}`); }
  async searchSocialProfiles(q: string): Promise<any[]> { return this.get(`/social/profiles/search?q=${encodeURIComponent(q)}`); }
  async getSocialStats(): Promise<any> { return this.get('/social/stats'); }

  // Posts
  async createSocialPost(data: { content: string; images?: string[]; videos?: string[]; tags?: string[] }): Promise<any> {
    return this.post('/social/posts', data);
  }
  async getFeed(page = 1, limit = 20): Promise<any> {
    return this.get(`/social/feed?page=${page}&limit=${limit}`);
  }
  async getSocialPost(id: string): Promise<any> { return this.get(`/social/posts/${id}`); }
  async getUserPosts(userId: string, page = 1, limit = 20): Promise<any> {
    return this.get(`/social/users/${userId}/posts?page=${page}&limit=${limit}`);
  }
  async updateSocialPost(id: string, data: any): Promise<any> { return this.patch(`/social/posts/${id}`, data); }
  async deleteSocialPost(id: string): Promise<any> { return this.delete(`/social/posts/${id}`); }

  // Catalogs
  async createSocialCatalog(data: any): Promise<any> { return this.post('/social/catalogs', data); }
  async getMyCatalogs(page = 1, limit = 20, status?: string): Promise<any> {
    let url = `/social/catalogs?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.get(url);
  }
  async getPublicCatalogs(page = 1, limit = 20): Promise<any> {
    return this.get(`/social/catalogs/public?page=${page}&limit=${limit}`);
  }
  async getSocialCatalog(id: string): Promise<any> { return this.get(`/social/catalogs/${id}`); }
  async updateSocialCatalog(id: string, data: any): Promise<any> { return this.patch(`/social/catalogs/${id}`, data); }
  async deleteSocialCatalog(id: string): Promise<any> { return this.delete(`/social/catalogs/${id}`); }
  async publishSocialCatalog(id: string): Promise<any> { return this.post(`/social/catalogs/${id}/publish`, {}); }

  // Catalog Items
  async addCatalogItem(catalogId: string, data: any): Promise<any> { return this.post(`/social/catalogs/${catalogId}/items`, data); }
  async updateCatalogItem(catalogId: string, itemId: string, data: any): Promise<any> { return this.patch(`/social/catalogs/${catalogId}/items/${itemId}`, data); }
  async deleteCatalogItem(catalogId: string, itemId: string): Promise<any> { return this.delete(`/social/catalogs/${catalogId}/items/${itemId}`); }
  async reorderCatalogItems(catalogId: string, items: { id: string; sortOrder: number }[]): Promise<any> {
    return this.post(`/social/catalogs/${catalogId}/items/reorder`, { items });
  }

  // Comments
  async createSocialComment(data: { content: string; postId?: string; catalogId?: string; parentId?: string }): Promise<any> {
    return this.post('/social/comments', data);
  }
  async getPostComments(postId: string, page = 1, limit = 20): Promise<any> {
    return this.get(`/social/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }
  async getCatalogComments(catalogId: string, page = 1, limit = 20): Promise<any> {
    return this.get(`/social/catalogs/${catalogId}/comments?page=${page}&limit=${limit}`);
  }
  async deleteSocialComment(id: string): Promise<any> { return this.delete(`/social/comments/${id}`); }

  // Reactions
  async toggleSocialReaction(data: { postId?: string; commentId?: string; catalogId?: string; type?: string }): Promise<any> {
    return this.post('/social/reactions', data);
  }
  async getSocialReactions(postId?: string, commentId?: string, catalogId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (postId) params.set('postId', postId);
    if (commentId) params.set('commentId', commentId);
    if (catalogId) params.set('catalogId', catalogId);
    return this.get(`/social/reactions?${params}`);
  }

  // Follows
  async toggleFollow(userId: string): Promise<any> { return this.post(`/social/follow/${userId}`, {}); }
  async getFollowers(userId: string, page = 1, limit = 50): Promise<any> {
    return this.get(`/social/followers/${userId}?page=${page}&limit=${limit}`);
  }
  async getFollowing(userId: string, page = 1, limit = 50): Promise<any> {
    return this.get(`/social/following/${userId}?page=${page}&limit=${limit}`);
  }
  async isFollowing(userId: string): Promise<any> { return this.get(`/social/follow/${userId}/status`); }
  async getFollowCounts(): Promise<any> { return this.get('/social/follow/counts'); }

  // Notifications
  async getSocialNotifications(page = 1, limit = 50): Promise<any> {
    return this.get(`/social/notifications?page=${page}&limit=${limit}`);
  }
  async getUnreadNotificationCount(): Promise<any> { return this.get('/social/notifications/unread-count'); }
  async markNotificationRead(id: string): Promise<any> { return this.patch(`/social/notifications/${id}/read`, {}); }
  async markAllNotificationsRead(): Promise<any> { return this.post('/social/notifications/read-all', {}); }

  // Messages
  async createSocialThread(data: { title?: string; memberIds: string[] }): Promise<any> { return this.post('/social/threads', data); }
  async getUserThreads(): Promise<any[]> { return this.get('/social/threads'); }
  async sendSocialMessage(data: { content: string; threadId?: string; recipientId?: string; images?: string[] }): Promise<any> {
    return this.post('/social/messages', data);
  }
  async getThreadMessages(threadId: string, page = 1, limit = 50): Promise<any> {
    return this.get(`/social/threads/${threadId}/messages?page=${page}&limit=${limit}`);
  }
  async markThreadAsRead(threadId: string): Promise<any> { return this.post(`/social/threads/${threadId}/read`, {}); }
  async getUnreadMessageCount(): Promise<any> { return this.get('/social/messages/unread-count'); }
}

export const api = new ApiClient();

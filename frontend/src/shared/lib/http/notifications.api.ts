import { api } from './client';

export function getNotifications() { return api.get<any[]>('/notifications'); }
export function getUnreadCount() { return api.get<{ count: number }>('/notifications/unread-count'); }
export function createNotification(data: { type: string; title: string; message?: string; link?: string }) { return api.post<any>('/notifications', data); }
export function markAsRead(id: string) { return api.patch<any>(`/notifications/${id}/read`, {}); }
export function markAllAsRead() { return api.post<any>('/notifications/read-all', {}); }
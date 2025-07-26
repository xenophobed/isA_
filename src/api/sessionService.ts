/**
 * Session API Service
 * 
 * 基于 Session API 的服务层，提供完整的会话管理功能
 * 使用 BaseApiService 进行网络通信
 */

import { BaseApiService, ApiResponse } from './BaseApiService';
import { config } from '../config';
import {
  Session,
  SessionMessage,
  SessionMetadata,
  SessionResponse,
  SessionListResponse,
  SessionMessagesResponse,
  SessionContext,
  SessionExportFormat,
  GetSessionsOptions,
  GetUserSessionsOptions,
  GetSessionOptions,
  GetSessionMessagesOptions,
  SearchSessionsOptions,
  UpdateSessionData
} from '../types/sessionTypes';

// ================================================================================
// Session Service 类
// ================================================================================

export class SessionService {
  private apiService: BaseApiService;
  private readonly sessionBaseUrl: string;

  constructor() {
    // 从配置中获取 Session API 的基础 URL
    // Session API 运行在主 API 服务的 /api/sessions 路径下
    this.sessionBaseUrl = config.api.baseUrl;
    this.apiService = new BaseApiService(this.sessionBaseUrl);
  }

  /**
   * 构建完整的 Session API 端点
   */
  private buildSessionEndpoint(path: string): string {
    const basePath = '/api/sessions';
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${fullPath}`;
  }

  // ================================================================================
  // Session 管理方法
  // ================================================================================

  /**
   * 创建新会话
   */
  async createSession(
    userId: string, 
    title?: string, 
    metadata?: SessionMetadata
  ): Promise<ApiResponse<SessionResponse>> {
    const params = new URLSearchParams({ user_id: userId });
    if (title) params.append('title', title);
    if (metadata) params.append('metadata', JSON.stringify(metadata));

    const endpoint = this.buildSessionEndpoint(`?${params.toString()}`);
    return this.apiService.post<SessionResponse>(endpoint);
  }

  /**
   * 获取所有会话列表
   */
  async getSessions(options?: GetSessionsOptions): Promise<ApiResponse<SessionListResponse>> {
    const params = new URLSearchParams();
    if (options?.user_id) params.append('user_id', options.user_id);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.search) params.append('search', options.search);

    const queryString = params.toString();
    const endpoint = this.buildSessionEndpoint(queryString ? `?${queryString}` : '');
    return this.apiService.get<SessionListResponse>(endpoint);
  }

  /**
   * 获取特定用户的会话
   */
  async getUserSessions(
    userId: string, 
    options?: GetUserSessionsOptions
  ): Promise<ApiResponse<SessionListResponse>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = this.buildSessionEndpoint(`/user/${userId}${queryString ? `?${queryString}` : ''}`);
    return this.apiService.get<SessionListResponse>(endpoint);
  }

  /**
   * 获取活跃会话
   */
  async getActiveSessions(limit?: number): Promise<ApiResponse<SessionListResponse>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const endpoint = this.buildSessionEndpoint(`/active${queryString ? `?${queryString}` : ''}`);
    return this.apiService.get<SessionListResponse>(endpoint);
  }

  /**
   * 获取会话详情
   */
  async getSession(
    sessionId: string, 
    options?: GetSessionOptions
  ): Promise<ApiResponse<SessionResponse>> {
    const params = new URLSearchParams();
    if (options?.include_history) params.append('include_history', 'true');
    if (options?.include_stats) params.append('include_stats', 'true');

    const queryString = params.toString();
    const endpoint = this.buildSessionEndpoint(`/${sessionId}${queryString ? `?${queryString}` : ''}`);
    return this.apiService.get<SessionResponse>(endpoint);
  }

  /**
   * 更新会话
   */
  async updateSession(
    sessionId: string,
    updates: UpdateSessionData
  ): Promise<ApiResponse<SessionResponse>> {
    const params = new URLSearchParams();
    if (updates.title) params.append('title', updates.title);
    if (updates.tags) params.append('tags', JSON.stringify(updates.tags));
    if (updates.metadata) params.append('metadata', JSON.stringify(updates.metadata));

    const endpoint = this.buildSessionEndpoint(`/${sessionId}?${params.toString()}`);
    return this.apiService.put<SessionResponse>(endpoint);
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const endpoint = this.buildSessionEndpoint(`/${sessionId}`);
    return this.apiService.delete(endpoint);
  }

  // ================================================================================
  // Session 消息管理
  // ================================================================================

  /**
   * 获取会话消息
   */
  async getSessionMessages(
    sessionId: string,
    options?: GetSessionMessagesOptions
  ): Promise<ApiResponse<SessionMessagesResponse>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.role) params.append('role', options.role);

    const queryString = params.toString();
    const endpoint = this.buildSessionEndpoint(`/${sessionId}/messages${queryString ? `?${queryString}` : ''}`);
    return this.apiService.get<SessionMessagesResponse>(endpoint);
  }

  // ================================================================================
  // Session 上下文管理
  // ================================================================================

  /**
   * 获取会话上下文
   */
  async getSessionContext(sessionId: string): Promise<ApiResponse<SessionContext>> {
    const endpoint = this.buildSessionEndpoint(`/${sessionId}/context`);
    return this.apiService.get<SessionContext>(endpoint);
  }

  /**
   * 更新会话上下文
   */
  async updateSessionContext(
    sessionId: string, 
    context: SessionContext
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const endpoint = this.buildSessionEndpoint(`/${sessionId}/context`);
    return this.apiService.put(endpoint, context);
  }

  /**
   * 清除会话上下文
   */
  async clearSessionContext(sessionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const endpoint = this.buildSessionEndpoint(`/${sessionId}/context`);
    return this.apiService.delete(endpoint);
  }

  // ================================================================================
  // Session 统计和导出
  // ================================================================================

  /**
   * 获取会话统计
   */
  async getSessionStats(sessionId: string): Promise<ApiResponse<any>> {
    const endpoint = this.buildSessionEndpoint(`/${sessionId}/stats`);
    return this.apiService.get(endpoint);
  }

  /**
   * 导出会话数据
   */
  async exportSession(
    sessionId: string, 
    format: SessionExportFormat = 'json'
  ): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ format });
    const endpoint = this.buildSessionEndpoint(`/${sessionId}/export?${params.toString()}`);
    return this.apiService.get(endpoint);
  }

  /**
   * 搜索会话
   */
  async searchSessions(
    query: string,
    options?: SearchSessionsOptions
  ): Promise<ApiResponse<SessionListResponse>> {
    const params = new URLSearchParams({ query });
    if (options?.user_id) params.append('user_id', options.user_id);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const endpoint = this.buildSessionEndpoint(`/search?${params.toString()}`);
    return this.apiService.get<SessionListResponse>(endpoint);
  }

  // ================================================================================
  // 健康检查
  // ================================================================================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<ApiResponse<any>> {
    // 健康检查通常在根路径下，不在 /api/sessions 下
    return this.apiService.get('/health');
  }
}

// ================================================================================
// 单例实例和便捷导出
// ================================================================================

// 创建单例实例
export const sessionService = new SessionService();

// 导出便捷方法
export const {
  createSession,
  getSessions,
  getUserSessions,
  getActiveSessions,
  getSession,
  updateSession,
  deleteSession,
  getSessionMessages,
  getSessionContext,
  updateSessionContext,
  clearSessionContext,
  getSessionStats,
  exportSession,
  searchSessions,
  healthCheck
} = sessionService;

// 重新导出所有Session相关类型，方便使用
export type {
  Session,
  SessionMessage,
  SessionMetadata,
  SessionResponse,
  SessionListResponse,
  SessionMessagesResponse,
  SessionContext,
  SessionExportFormat,
  SessionStatus,
  GetSessionsOptions,
  GetUserSessionsOptions,
  GetSessionOptions,
  GetSessionMessagesOptions,
  SearchSessionsOptions,
  UpdateSessionData,
  SessionStats,
  SessionExportData,
  SessionSearchResult,
  SessionSearchResponse,
  SessionApiError
} from '../types/sessionTypes';

export default sessionService;
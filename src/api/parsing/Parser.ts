/**
 * ============================================================================
 * Base Parser Interface - 解析器基础接口
 * ============================================================================
 * 
 * 核心职责:
 * - 定义统一的解析器接口标准
 * - 提供类型安全的解析结果
 * - 支持链式解析和组合解析
 * - 错误处理和验证机制
 */

// ================================================================================
// 基础类型定义
// ================================================================================

export interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: ParseError;
  metadata?: Record<string, any>;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public code: string,
    public source: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export interface ParserOptions {
  strict?: boolean;
  timeout?: number;
  encoding?: 'utf-8' | 'base64' | 'binary';
  maxSize?: number;
  [key: string]: any;
}

// ================================================================================
// 解析器接口
// ================================================================================

export interface Parser<TInput, TOutput> {
  readonly name: string;
  readonly version: string;
  
  canParse(data: TInput): boolean;
  parse(data: TInput): TOutput | null;
  validate?(data: TOutput): boolean;
}

// ================================================================================
// 基础解析器实现
// ================================================================================

export abstract class BaseParser<TInput, TOutput> implements Parser<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly version: string;
  
  constructor(protected options: ParserOptions = {}) {}
  
  abstract canParse(data: TInput): boolean;
  abstract parse(data: TInput): TOutput | null;
  
  validate(data: TOutput): boolean {
    return data !== null && data !== undefined;
  }
  
  protected createError(message: string, code: string, details?: any): ParseError {
    return new ParseError(message, code, this.name, details);
  }
}
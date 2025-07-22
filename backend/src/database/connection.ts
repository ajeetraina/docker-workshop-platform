import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '@/config/env';
import { logger, logDatabaseQuery } from '@/utils/logger';

let pool: Pool;

/**
 * Initialize database connection pool
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.database.connectionTimeout,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ Database connection established successfully');
    
    // Set up connection event handlers
    pool.on('connect', () => {
      logger.debug('New database connection established');
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle database client:', err);
    });

  } catch (error) {
    logger.error('❌ Failed to initialize database connection:', error);
    throw error;
  }
};

/**
 * Get database connection pool
 */
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

/**
 * Execute a query with parameters
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const startTime = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - startTime;
    
    logDatabaseQuery(text, params, duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Database query failed:', {
      query: text,
      params,
      duration,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

/**
 * Execute a query within a transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close database connection pool
 */
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database connection pool closed');
  }
};

/**
 * Check database health
 */
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  activeConnections: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM pg_stat_activity WHERE state = $1', ['active']);
    const responseTime = Date.now() - startTime;
    const activeConnections = parseInt(result.rows[0]?.count || '0', 10);
    
    return {
      status: 'healthy',
      responseTime,
      activeConnections,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      status: 'unhealthy',
      responseTime,
      activeConnections: 0,
      error: errorMessage,
    };
  }
};

/**
 * Database utility functions
 */
export const dbUtils = {
  /**
   * Check if a table exists
   */
  tableExists: async (tableName: string): Promise<boolean> => {
    const result = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0]?.exists || false;
  },

  /**
   * Get table row count
   */
  getRowCount: async (tableName: string): Promise<number> => {
    const result = await query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0]?.count || '0', 10);
  },

  /**
   * Truncate table (use with caution!)
   */
  truncateTable: async (tableName: string): Promise<void> => {
    await query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
    logger.warn(`Table ${tableName} truncated`);
  },

  /**
   * Execute multiple queries in sequence
   */
  executeBatch: async (queries: Array<{ text: string; params?: any[] }>): Promise<void> => {
    await transaction(async (client) => {
      for (const queryDef of queries) {
        await client.query(queryDef.text, queryDef.params);
      }
    });
  },
};

// Helper types for database operations
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginate query results
 */
export const paginate = async <T>(
  baseQuery: string,
  countQuery: string,
  params: any[],
  options: PaginationOptions
): Promise<PaginationResult<T>> => {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get paginated data
  const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query<T>(dataQuery, [...params, limit, offset]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Build WHERE clause from filters
 */
export const buildWhereClause = (
  filters: Record<string, any>,
  startParamIndex: number = 1
): { clause: string; params: any[]; nextParamIndex: number } => {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Handle IN clause
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // Handle LIKE clause
        conditions.push(`${key} ILIKE $${paramIndex++}`);
        params.push(value);
      } else {
        // Handle equality
        conditions.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }
  });

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return {
    clause,
    params,
    nextParamIndex: paramIndex,
  };
};

export default {
  initializeDatabase,
  getPool,
  query,
  transaction,
  closeDatabase,
  checkDatabaseHealth,
  dbUtils,
  paginate,
  buildWhereClause,
};


export interface Column {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Relationship {
  source: string;
  target: string;
}

export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

export interface FileStatus {
  id: number;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export type QueryResultData = Record<string, any>[] | DocumentResult[];

export interface DocumentResult {
    id: string;
    title: string;
    snippet: string;
    source: string;
}

export interface QueryResult {
  type: 'sql' | 'document' | 'hybrid';
  data: QueryResultData;
  sqlQuery?: string;
  performance: {
    responseTime: number;
    cacheHit: boolean;
  };
}

export type ViewType = 'ingestion' | 'query' | 'dashboard';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
}

export interface QueryPerformanceData {
  time: string;
  responseTime: number;
  cacheHit: number;
}

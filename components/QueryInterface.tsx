
import React, { useState } from 'react';
import type { Schema, QueryResult, QueryHistoryItem, DocumentResult } from '../types';
import { processQuery } from '../services/mockApiService';
import { Card, Button, Spinner } from './UI';
import { HistoryIcon, ChevronDownIcon, TableIcon, FileIcon } from './Icons';

interface QueryInterfaceProps {
  schema: Schema | null;
  onNewResult: (result: QueryResult, query: string) => void;
  lastResult: QueryResult | null;
  queryHistory: QueryHistoryItem[];
}

export const QueryInterface: React.FC<QueryInterfaceProps> = ({ schema, onNewResult, lastResult, queryHistory }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await processQuery(query, schema);
      onNewResult(result, query);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-medium">Natural Language Query</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me all Python developers in Engineering"
              className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
             <QueryHistoryDropdown history={queryHistory} onSelect={setQuery} />
            <Button type="submit" disabled={isLoading || !schema}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Query
            </Button>
          </div>
          {!schema && <p className="text-sm text-yellow-600 dark:text-yellow-400">Please connect to a database first to enable querying.</p>}
        </form>
      </Card>
      
      {isLoading && <div className="flex justify-center items-center py-10"><Spinner className="h-8 w-8 text-primary-500" /> <span className="ml-3 text-lg">Searching database and documents...</span></div>}
      
      {error && <div className="text-red-500">{error}</div>}

      {lastResult && !isLoading && <ResultsView result={lastResult} />}
    </div>
  );
};

// QueryHistoryDropdown sub-component
const QueryHistoryDropdown: React.FC<{history: QueryHistoryItem[], onSelect: (query: string) => void}> = ({ history, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (history.length === 0) return null;

    return (
        <div className="relative">
            <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}><HistoryIcon className="h-5 w-5" /></Button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                    <ul className="py-1">
                        {history.map(item => (
                            <li key={item.id} onClick={() => { onSelect(item.query); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer truncate">
                                {item.query}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// ResultsView sub-component
const ResultsView: React.FC<{result: QueryResult}> = ({ result }) => {
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Query Results</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                    <span>{`Query took ${result.performance.responseTime.toFixed(0)}ms`}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${result.performance.cacheHit ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                        {result.performance.cacheHit ? 'CACHE HIT' : 'CACHE MISS'}
                    </span>
                </div>
            </div>
            
            {result.sqlQuery && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 rounded-md">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Generated SQL:</p>
                    <code className="text-xs text-green-600 dark:text-green-400 font-mono">{result.sqlQuery}</code>
                </div>
            )}
            
            {result.type === 'sql' && <TableView data={result.data as Record<string, any>[]} />}
            {result.type === 'document' && <DocumentCardView data={result.data as DocumentResult[]} />}
            {result.type === 'hybrid' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2 flex items-center"><TableIcon className="mr-2"/> Structured Data</h4>
                  <TableView data={result.data.filter(item => 'full_name' in item) as Record<string, any>[]} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 flex items-center"><FileIcon className="mr-2"/> Document Results</h4>
                  <DocumentCardView data={result.data.filter(item => 'snippet' in item) as DocumentResult[]} />
                </div>
              </div>
            )}
        </Card>
    );
};

const TableView: React.FC<{data: Record<string, any>[]}> = ({data}) => {
    if (data.length === 0) return <p>No results found.</p>;
    const headers = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header.replace(/_/g, ' ')}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((row, i) => (
                        <tr key={i}>
                            {headers.map(header => (
                                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{String(row[header])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DocumentCardView: React.FC<{data: DocumentResult[]}> = ({data}) => {
    if (data.length === 0) return <p>No documents found.</p>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(doc => (
                <Card key={doc.id} className="flex flex-col">
                    <h5 className="font-bold text-primary-600 dark:text-primary-400 truncate">{doc.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex-grow">"{doc.snippet}"</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-right">{doc.source}</p>
                </Card>
            ))}
        </div>
    );
}


import React, { useState, useEffect } from 'react';
import type { Schema, FileStatus, QueryPerformanceData, QueryResult } from '../types';
import { Card, Spinner } from './UI';
import { DatabaseIcon, FileIcon } from './Icons';

// Add Recharts to the global window interface for TypeScript
declare global {
    interface Window {
        Recharts: any;
    }
}

interface DashboardProps {
  schema: Schema | null;
  files: FileStatus[];
  performanceData: QueryPerformanceData[];
  lastResult: QueryResult | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ schema, files, performanceData, lastResult }) => {
    const [rechartsLoaded, setRechartsLoaded] = useState(typeof window.Recharts !== 'undefined');

    useEffect(() => {
        if (rechartsLoaded) return;

        const interval = setInterval(() => {
            if (typeof window.Recharts !== 'undefined') {
                setRechartsLoaded(true);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [rechartsLoaded]);

    const completedFiles = files.filter(f => f.status === 'completed').length;
    const cacheHits = performanceData.filter(p => p.cacheHit).length;
    const cacheHitRate = performanceData.length > 0 ? (cacheHits / performanceData.length) * 100 : 0;
    
    const renderChart = () => {
        if (!rechartsLoaded) {
            return (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Spinner className="h-6 w-6 mr-2" />
                    <span>Loading Chart...</span>
                </div>
            );
        }

        const { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } = window.Recharts;

        return (
            <ResponsiveContainer>
                <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)"/>
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                            borderColor: 'rgba(107, 114, 128, 0.5)'
                        }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="responseTime" name="Response Time (ms)" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Tables Discovered" 
                    value={schema?.tables.length || 0}
                    icon={<DatabaseIcon className="h-8 w-8 text-blue-500" />}
                />
                 <StatCard 
                    title="Documents Indexed" 
                    value={completedFiles}
                    icon={<FileIcon className="h-8 w-8 text-green-500" />}
                />
                 <StatCard 
                    title="Cache Hit Rate" 
                    value={`${cacheHitRate.toFixed(1)}%`}
                    description={`${cacheHits} of ${performanceData.length} queries`}
                />
                 <StatCard 
                    title="Avg. Response Time" 
                    value={performanceData.length > 0 ? `${(performanceData.reduce((acc, p) => acc + p.responseTime, 0) / performanceData.length).toFixed(0)}ms` : 'N/A'}
                    description="Avg. of last 20 queries"
                />
            </div>
            
            <Card>
                <h3 className="text-xl font-semibold mb-4">Query Performance</h3>
                <div style={{ width: '100%', height: 300 }}>
                    {renderChart()}
                </div>
            </Card>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon }) => {
    return (
        <Card className="flex items-center">
            {icon && <div className="mr-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">{icon}</div>}
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
                {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
        </Card>
    );
}
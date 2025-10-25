
import React, { useState, useCallback, useEffect } from 'react';
import type { ViewType, Schema, FileStatus, QueryResult, QueryHistoryItem, QueryPerformanceData } from './types';
import { DatabaseIcon, FileTextIcon, HomeIcon, LayoutDashboardIcon, MoonIcon, SunIcon, XIcon } from './components/Icons';
import { DataIngestion } from './components/DataIngestion';
import { QueryInterface } from './components/QueryInterface';
import { Dashboard } from './components/Dashboard';

const useDarkMode = (): [string, () => void] => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  return [theme, toggleTheme];
};


const App: React.FC = () => {
  const [theme, toggleTheme] = useDarkMode();
  const [activeView, setActiveView] = useState<ViewType>('ingestion');
  const [schema, setSchema] = useState<Schema | null>(null);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<QueryResult | null>(null);
  const [performanceData, setPerformanceData] = useState<QueryPerformanceData[]>([]);

  const handleNewResult = useCallback((result: QueryResult, query: string) => {
    setLastResult(result);
    setQueryHistory(prev => [{ id: Date.now().toString(), query, timestamp: new Date().toISOString() }, ...prev].slice(0, 10));
    setPerformanceData(prev => [
        ...prev,
        {
            time: new Date().toLocaleTimeString(),
            responseTime: result.performance.responseTime,
            cacheHit: result.performance.cacheHit ? 1 : 0,
        }
    ].slice(-20));
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'ingestion':
        return <DataIngestion schema={schema} setSchema={setSchema} files={files} setFiles={setFiles} />;
      case 'query':
        return <QueryInterface schema={schema} onNewResult={handleNewResult} lastResult={lastResult} queryHistory={queryHistory}/>;
      case 'dashboard':
        return <Dashboard schema={schema} files={files} performanceData={performanceData} lastResult={lastResult}/>;
      default:
        return <DataIngestion schema={schema} setSchema={setSchema} files={files} setFiles={setFiles} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <HomeIcon className="h-8 w-8 text-primary-500" />
            <h1 className="text-xl font-bold ml-3">NLP Query</h1>
        </div>
        <div className="flex-grow p-4">
            <SidebarButton text="Data Ingestion" icon={<DatabaseIcon />} active={activeView === 'ingestion'} onClick={() => setActiveView('ingestion')} />
            <SidebarButton text="Query Interface" icon={<FileTextIcon />} active={activeView === 'query'} onClick={() => setActiveView('query')} disabled={!schema}/>
            <SidebarButton text="Dashboard" icon={<LayoutDashboardIcon />} active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} disabled={!schema}/>
        </div>
         <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={toggleTheme} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  {theme === 'light' ? <MoonIcon className="h-5 w-5 mr-2" /> : <SunIcon className="h-5 w-5 mr-2" />}
                  <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
              </button>
          </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <h2 className="text-2xl font-semibold capitalize">{activeView.replace('-', ' ')}</h2>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};


interface SidebarButtonProps {
    text: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ text, icon, active, onClick, disabled }) => {
    const baseClasses = "w-full flex items-center p-3 my-1 rounded-lg text-left text-base font-medium transition-colors";
    const activeClasses = "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300";
    const inactiveClasses = "hover:bg-gray-200 dark:hover:bg-gray-700";
    const disabledClasses = "opacity-50 cursor-not-allowed";
    
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : ''}`}
        >
            <span className="mr-3">{icon}</span>
            {text}
        </button>
    );
};


export default App;

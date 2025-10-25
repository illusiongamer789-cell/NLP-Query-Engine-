import React, { useState, useCallback } from 'react';
import type { Schema, FileStatus } from '../types';
import { connectToDatabase } from '../services/mockApiService';
import { SchemaVisualizer } from './SchemaVisualizer';
import { Card, Button, Spinner, ProgressBar, Alert } from './UI';
import { UploadCloudIcon, CheckCircleIcon, AlertTriangleIcon, XIcon, FileIcon } from './Icons';

interface DataIngestionProps {
  schema: Schema | null;
  setSchema: (schema: Schema | null) => void;
  files: FileStatus[];
  // FIX: Correctly type the setFiles prop to accept a state updater function.
  setFiles: React.Dispatch<React.SetStateAction<FileStatus[]>>;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({ schema, setSchema, files, setFiles }) => {
  const [activeTab, setActiveTab] = useState<'database' | 'documents'>('database');
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <TabButton name="database" activeTab={activeTab} setActiveTab={setActiveTab}>Connect Database</TabButton>
            <TabButton name="documents" activeTab={activeTab} setActiveTab={setActiveTab}>Upload Documents</TabButton>
          </nav>
        </div>
        <div className="pt-6">
          {activeTab === 'database' && <DatabaseConnector setSchema={setSchema} />}
          {activeTab === 'documents' && <DocumentUploader files={files} setFiles={setFiles}/>}
        </div>
      </Card>
      {schema && (
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Discovered Schema</h3>
          <SchemaVisualizer schema={schema} />
        </Card>
      )}
    </div>
  );
};

// TabButton sub-component
interface TabButtonProps {
    name: 'database' | 'documents';
    activeTab: 'database' | 'documents';
    setActiveTab: (tab: 'database' | 'documents') => void;
    children: React.ReactNode;
}
const TabButton: React.FC<TabButtonProps> = ({name, activeTab, setActiveTab, children}) => {
    const isActive = activeTab === name;
    return (
        <button
          onClick={() => setActiveTab(name)}
          className={`${
            isActive
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          {children}
        </button>
    )
}

// DatabaseConnector sub-component
const DatabaseConnector: React.FC<{setSchema: (schema: Schema) => void}> = ({ setSchema }) => {
  const [connectionString, setConnectionString] = useState('postgresql://user:pass@localhost/company_db');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const discoveredSchema = await connectToDatabase(connectionString);
      setSchema(discoveredSchema);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Database Connection</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">Enter your database connection string to automatically discover the schema.</p>
      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
        <input
          type="text"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="e.g., postgresql://user:pass@host/dbname"
          className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
        <Button onClick={handleConnect} disabled={isLoading}>
          {isLoading && <Spinner className="mr-2"/>}
          Connect & Analyze
        </Button>
      </div>
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={`Successfully connected and discovered schema.`} />}
    </div>
  );
};


// DocumentUploader sub-component
// FIX: Correctly type the setFiles prop to accept a state updater function.
const DocumentUploader: React.FC<{files: FileStatus[], setFiles: React.Dispatch<React.SetStateAction<FileStatus[]>>}> = ({files, setFiles}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((incomingFiles: FileList) => {
        const newFiles: FileStatus[] = Array.from(incomingFiles).map((file, index) => ({
            id: Date.now() + index,
            file,
            status: 'uploading',
            progress: 0,
        }));
        setFiles(prev => [...prev, ...newFiles]);

        newFiles.forEach(fileStatus => {
            // Simulate upload
            const uploadInterval = setInterval(() => {
                setFiles(prev => prev.map(f => f.id === fileStatus.id ? {...f, progress: Math.min(f.progress + 10, 100)} : f));
            }, 100);

            setTimeout(() => {
                clearInterval(uploadInterval);
                setFiles(prev => prev.map(f => f.id === fileStatus.id ? {...f, status: 'processing', progress: 0} : f));
                // Simulate processing
                const processInterval = setInterval(() => {
                    setFiles(prev => prev.map(f => f.id === fileStatus.id ? {...f, progress: Math.min(f.progress + 20, 100)} : f));
                }, 200);

                setTimeout(() => {
                    clearInterval(processInterval);
                    setFiles(prev => prev.map(f => f.id === fileStatus.id ? {...f, status: 'completed'} : f));
                }, 1000);
            }, 1000);
        });

    }, [setFiles]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };
    
    const onButtonClick = () => fileInputRef.current?.click();

    return (
        <div className="space-y-4">
             <h3 className="text-lg font-medium">Document Upload</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400">Upload employee documents like resumes, performance reviews, etc. (PDF, DOCX, TXT).</p>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}`}
            >
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} accept=".pdf,.docx,.txt,.csv" />
                <div className="text-center">
                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400"/>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOCX, TXT, CSV (up to 10MB each)</p>
                </div>
            </div>
            {files.length > 0 && (
                <div className="space-y-3 pt-4">
                    <h4 className="font-medium">Uploads</h4>
                    {files.map(f => <FileProgress key={f.id} fileStatus={f} />)}
                </div>
            )}
        </div>
    );
};

const FileProgress: React.FC<{ fileStatus: FileStatus }> = ({ fileStatus }) => {
    const getStatusInfo = () => {
        switch(fileStatus.status) {
            case 'uploading': return { text: 'Uploading...', color: 'text-blue-500' };
            case 'processing': return { text: 'Processing...', color: 'text-yellow-500' };
            case 'completed': return { text: 'Completed', icon: <CheckCircleIcon className="text-green-500 h-5 w-5"/> };
            case 'error': return { text: `Error: ${fileStatus.error}`, icon: <AlertTriangleIcon className="text-red-500 h-5 w-5"/> };
        }
    };
    const { text, color, icon } = getStatusInfo();
    return (
        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center truncate">
                    <FileIcon className="h-5 w-5 mr-2 text-gray-400"/>
                    <span className="truncate font-medium">{fileStatus.file.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${color}`}>{text}</span>
                    {icon}
                </div>
            </div>
            {(fileStatus.status === 'uploading' || fileStatus.status === 'processing') && 
                <div className="mt-2">
                    <ProgressBar progress={fileStatus.progress} />
                </div>
            }
        </div>
    );
};
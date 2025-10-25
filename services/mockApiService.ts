
import { GoogleGenAI, Type } from "@google/genai";
import type { Schema, QueryResult, QueryResultData, DocumentResult } from '../types';

// Mock Gemini Service
class MockGeminiService {
  async generateSqlFromNlq(query: string, schema: Schema): Promise<string> {
    console.log("Gemini: Generating SQL for query:", query);
    // In a real app, this would use ai.models.generateContent
    // For this mock, we'll do simple keyword matching.
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate LLM thinking time
    
    const lowerCaseQuery = query.toLowerCase();
    if (lowerCaseQuery.includes("how many employees")) {
        return `SELECT COUNT(emp_id) FROM employees;`;
    }
    if (lowerCaseQuery.includes("python developers in engineering")) {
        return `SELECT e.full_name, e.position, d.dept_name 
FROM employees e 
JOIN departments d ON e.dept_id = d.dept_id 
WHERE e.position LIKE '%Python Developer%' AND d.dept_name = 'Engineering';`;
    }
    if (lowerCaseQuery.includes("average salary")) {
        return `SELECT d.dept_name, AVG(e.annual_salary) as average_salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_name;`;
    }
    return `SELECT * FROM employees LIMIT 10;`;
  }
}

const mockGemini = new MockGeminiService();

// Mock Data
const MOCK_SCHEMA: Schema = {
  tables: [
    { name: 'employees', columns: [
      { name: 'emp_id', type: 'INT', isPrimaryKey: true },
      { name: 'full_name', type: 'VARCHAR' },
      { name: 'dept_id', type: 'INT' },
      { name: 'position', type: 'VARCHAR' },
      { name: 'annual_salary', type: 'DECIMAL' },
      { name: 'join_date', type: 'DATE' },
    ]},
    { name: 'departments', columns: [
      { name: 'dept_id', type: 'INT', isPrimaryKey: true },
      { name: 'dept_name', type: 'VARCHAR' },
      { name: 'manager_id', type: 'INT' },
    ]},
    { name: 'documents', columns: [
        { name: 'doc_id', type: 'INT', isPrimaryKey: true },
        { name: 'emp_id', type: 'INT' },
        { name: 'type', type: 'VARCHAR' },
        { name: 'content', type: 'TEXT' },
    ]}
  ],
  relationships: [
    { source: 'employees', target: 'departments' },
    { source: 'documents', target: 'employees' },
  ]
};

const MOCK_SQL_RESULT_PYTHON_DEVS = [
  { full_name: 'Alice Johnson', position: 'Senior Python Developer', dept_name: 'Engineering' },
  { full_name: 'Bob Williams', position: 'Python Developer II', dept_name: 'Engineering' },
  { full_name: 'Charlie Brown', position: 'Backend Python Developer', dept_name: 'Engineering' },
];

const MOCK_DOCUMENT_RESULT_PYTHON_DEVS: DocumentResult[] = [
    { id: 'doc-101', title: "Alice_Johnson_Resume.pdf", snippet: "...extensive experience in Python, Django, and Flask to build scalable web applications...", source: "Uploaded Documents"},
    { id: 'doc-102', title: "Performance_Review_Q3.docx", snippet: "Bob Williams demonstrated excellent proficiency in Python during the new microservice development...", source: "Uploaded Documents"},
    { id: 'doc-103', title: "Project_Phoenix_Proposal.pdf", snippet: "...the core of the backend will be implemented in Python 3.10 for performance and reliability...", source: "Uploaded Documents"},
];


// API Service
export const connectToDatabase = (connectionString: string): Promise<Schema> => {
  return new Promise((resolve, reject) => {
    console.log(`Connecting to ${connectionString}...`);
    setTimeout(() => {
      if (connectionString.includes('fail')) {
        reject(new Error('Connection failed: Invalid credentials.'));
      } else {
        resolve(MOCK_SCHEMA);
      }
    }, 1500);
  });
};

export const processQuery = async (query: string, schema: Schema | null): Promise<QueryResult> => {
    return new Promise(async (resolve) => {
        console.log(`Processing query: ${query}...`);
        
        const isDocumentQuery = query.toLowerCase().includes('resume') || query.toLowerCase().includes('review');

        let result: QueryResult;
        
        if (isDocumentQuery) {
            result = {
                type: 'document',
                data: MOCK_DOCUMENT_RESULT_PYTHON_DEVS,
                performance: {
                    responseTime: Math.random() * 500 + 200,
                    cacheHit: Math.random() > 0.5,
                }
            };
        } else if (schema) {
             const sqlQuery = await mockGemini.generateSqlFromNlq(query, schema);
             result = {
                type: 'sql',
                data: MOCK_SQL_RESULT_PYTHON_DEVS,
                sqlQuery: sqlQuery,
                performance: {
                    responseTime: Math.random() * 1000 + 300,
                    cacheHit: Math.random() > 0.7,
                }
            };
        } else {
             result = { // Default to hybrid if no schema
                type: 'hybrid',
                data: [...MOCK_SQL_RESULT_PYTHON_DEVS, ...MOCK_DOCUMENT_RESULT_PYTHON_DEVS],
                sqlQuery: 'SELECT ...',
                performance: {
                    responseTime: Math.random() * 1200 + 500,
                    cacheHit: false,
                }
            };
        }

        setTimeout(() => resolve(result), 1500);
    });
};

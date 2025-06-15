import { useEffect, useState } from 'react';

/**
 * This component tests the API connection status
 * Use it for debugging connection issues
 */
const ApiTestPage = () => {
  const [apiStatus, setApiStatus] = useState('Testing...');
  const [apiError, setApiError] = useState(null);
  const [viteStatus, setViteStatus] = useState('Testing...');
  const [viteError, setViteError] = useState(null);

  useEffect(() => {
    // Test API connection
    fetch('http://localhost:8000/api/v1/')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setApiStatus(`Connected: ${JSON.stringify(data)}`);
      })
      .catch((error) => {
        setApiError(error.message);
        setApiStatus('Connection failed');
      });
      
    // Test Vite dev server
    fetch('/src/main.tsx')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Vite returned ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        setViteStatus(`Connected: Received ${data.length} bytes`);
      })
      .catch((error) => {
        setViteError(error.message);
        setViteStatus('Connection failed');
      });
  }, []);
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Backend API Status</h2>
        <div style={{ 
          padding: '10px', 
          borderRadius: '5px', 
          backgroundColor: apiError ? '#ffebee' : '#e8f5e9',
          border: `1px solid ${apiError ? '#ef9a9a' : '#a5d6a7'}`
        }}>
          <p><strong>Status:</strong> {apiStatus}</p>
          {apiError && (
            <p><strong>Error:</strong> {apiError}</p>
          )}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Troubleshooting:</strong>
          <ul>
            <li>Ensure the backend server is running on port 8000</li>
            <li>Check CORS settings in the backend</li>
            <li>Verify network connectivity</li>
          </ul>
        </div>
      </div>
      
      <div>
        <h2>Vite Dev Server Status</h2>
        <div style={{ 
          padding: '10px', 
          borderRadius: '5px', 
          backgroundColor: viteError ? '#ffebee' : '#e8f5e9',
          border: `1px solid ${viteError ? '#ef9a9a' : '#a5d6a7'}`
        }}>
          <p><strong>Status:</strong> {viteStatus}</p>
          {viteError && (
            <p><strong>Error:</strong> {viteError}</p>
          )}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Troubleshooting:</strong>
          <ul>
            <li>Try clearing the Vite cache (node fix-vite-server.mjs)</li>
            <li>Check for port conflicts</li>
            <li>Verify the source files exist</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;

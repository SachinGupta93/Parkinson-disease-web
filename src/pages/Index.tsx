
import React, { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';
import ConfigManager from '@/components/ConfigManager';
import { isConfigured } from '@/utils/config';
import { mongoService } from '@/services/mongoService';

const Index = () => {
  const [configured, setConfigured] = useState(isConfigured());
  
  useEffect(() => {
    // Check if MongoDB is configured
    setConfigured(isConfigured());
    
    // Re-check configuration status if it changes
    const checkConfig = () => {
      const newConfigStatus = isConfigured();
      if (newConfigStatus !== configured) {
        setConfigured(newConfigStatus);
      }
    };
    
    const interval = setInterval(checkConfig, 2000);
    return () => clearInterval(interval);
  }, [configured]);

  return (
    <div className="animate-fade-in space-y-8">
      {!configured && (
        <div className="mb-8">
          <ConfigManager />
        </div>
      )}
      <Dashboard />
    </div>
  );
};

export default Index;

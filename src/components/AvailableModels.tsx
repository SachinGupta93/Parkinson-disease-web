import React from 'react';
import { useBackendModels } from '@/hooks/useBackendModels';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const AvailableModels: React.FC = () => {
  const { models, loading, error, refreshModels } = useBackendModels();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Available ML Models</CardTitle>
        <button 
          onClick={refreshModels} 
          className="p-1 hover:bg-muted rounded-full"
          disabled={loading}
        >
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center text-sm text-destructive">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center text-sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading models...
          </div>
        ) : models.length === 0 ? (
          <div className="text-sm text-muted-foreground">No models available</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {models.map((model, i) => (
              <Badge key={i} variant="outline" className="flex items-center">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {model}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

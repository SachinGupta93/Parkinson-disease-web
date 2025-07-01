
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMongoUri, saveMongoConfig, clearMongoConfig } from '@/utils/config';
import { Database } from 'lucide-react';
import toast from 'react-hot-toast';

const ConfigManager: React.FC = () => {
  const [mongoUri, setMongoUri] = useState<string>(getMongoUri());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await saveMongoConfig(mongoUri);
      toast.success('MongoDB connection configured successfully!');
    } catch (error: any) {
      toast.error(`Configuration error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    clearMongoConfig();
    setMongoUri('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader className="bg-slate-50">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-xl">MongoDB Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure your MongoDB connection to access your Parkinson's data
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mongoUri">MongoDB Connection URI</Label>
              <Input
                id="mongoUri"
                placeholder="mongodb://username:password@host:port/database"
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                className="w-full"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter your MongoDB connection URI. This will be stored securely.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClear}
            disabled={isSubmitting || !mongoUri}
          >
            Clear Config
          </Button>
          <Button type="submit" disabled={isSubmitting || !mongoUri.startsWith('mongodb')}>
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ConfigManager;

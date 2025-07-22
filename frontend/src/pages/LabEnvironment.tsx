import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Clock, AlertCircle } from 'lucide-react';

import { workshopApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getStatusColor, formatRelativeTime, capitalize } from '@/lib/utils';

export const LabEnvironment = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  if (!sessionId) {
    return <div>Session not found</div>;
  }
  
  // Fetch session details
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['workshop', 'session', sessionId],
    queryFn: () => workshopApi.getSession(sessionId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Preparing your workshop environment...
          </h2>
          <p className="text-gray-600">
            This may take up to 30 seconds.
          </p>
        </div>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Session Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The workshop session you're looking for doesn't exist or has expired.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isActive = session.status === 'active';
  const isExpired = session.status === 'expired';
  const expiresAt = new Date(session.expiresAt);
  const timeRemaining = expiresAt.getTime() - Date.now();
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-white">
              Workshop Environment
            </h1>
            <Badge 
              variant="default" 
              className={getStatusColor(session.status)}
            >
              {capitalize(session.status)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {isActive && timeRemaining > 0 && (
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Expires {formatRelativeTime(session.expiresAt)}
                </span>
              </div>
            )}
            
            {isActive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(session.workspaceUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="h-[calc(100vh-80px)]">
        {isActive ? (
          <iframe
            src={session.workspaceUrl}
            className="w-full h-full border-none"
            title="Workshop Environment"
            allow="clipboard-read; clipboard-write"
          />
        ) : isExpired ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Session Expired
                </h2>
                <p className="text-gray-600 mb-4">
                  Your workshop session has expired. You can start a new session from the course page.
                </p>
                <Button onClick={() => window.history.back()}>
                  Return to Course
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Starting Environment
                </h2>
                <p className="text-gray-600">
                  Your workshop environment is being prepared. This may take a few moments.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface UseDataHook<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface PageDataProviderProps<T> {
  useDataHook: () => UseDataHook<T>;
  loadingComponent: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function PageDataProvider<T>({ useDataHook, loadingComponent, children }: PageDataProviderProps<T>) {
  const { data, error, isLoading } = useDataHook();

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (error && !data) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Calculation Error</AlertTitle>
          <AlertDescription>
            {error} Please correct the issues on the Inputs page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    // This case handles when loading is false but data is still null (e.g., initial state)
    return <>{loadingComponent}</>;
  }

  // The main content is rendered here, with an optional error alert at the top for non-blocking errors.
  return (
    <>
      {error && (
        <div className="p-4 md:p-8 pb-0">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Input Warning</AlertTitle>
                <AlertDescription>
                    {error} The data shown below may not be up-to-date.
                </AlertDescription>
            </Alert>
        </div>
      )}
      {children(data)}
    </>
  );
}

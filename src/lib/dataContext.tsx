import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData } from '../types/data';
import { loadAllDatasets } from './dataLoader';

interface DataContextType {
  data: AppData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const appData = await loadAllDatasets();
      setData(appData);
    } catch (err: unknown) {
      console.error('Failed to load datasets:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        data,
        isLoading,
        error,
        reload: fetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

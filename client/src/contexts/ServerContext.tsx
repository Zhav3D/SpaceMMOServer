import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ServerContextProps {
  serverStatus: any;
  isLoading: boolean;
  refetchStatus: () => void;
}

const ServerContext = createContext<ServerContextProps | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { 
    data: serverStatus, 
    isLoading,
    refetch: refetchStatus 
  } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return (
    <ServerContext.Provider value={{
      serverStatus,
      isLoading,
      refetchStatus
    }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServerContext must be used within a ServerProvider');
  }
  return context;
}
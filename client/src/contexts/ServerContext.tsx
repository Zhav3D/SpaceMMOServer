import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ServerContextProps {
  serverStatus: any;
  isLoading: boolean;
  refetchStatus: () => void;
  refreshServerStatus: () => void; // Added for backward compatibility
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

  // Provide both names for the refetch function for compatibility
  const refreshServerStatus = () => refetchStatus();

  return (
    <ServerContext.Provider value={{
      serverStatus,
      isLoading,
      refetchStatus,
      refreshServerStatus
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
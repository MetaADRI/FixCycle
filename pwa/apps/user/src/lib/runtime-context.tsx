'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getConfiguration, setConfiguration, type RuntimeConfiguration } from '@fixcycle/config';
import { applyThemeVars, themeToCssVars } from '@fixcycle/ui';

interface RuntimeContextValue {
  runtime: RuntimeConfiguration;
  applyRuntime: (configuration: RuntimeConfiguration) => void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

export function RuntimeProvider({ children }: { children: ReactNode }): ReactNode {
  const [runtime, setRuntimeState] = useState<RuntimeConfiguration>(() => getConfiguration());

  const applyRuntime = useCallback((configuration: RuntimeConfiguration): void => {
    setConfiguration(configuration);
    setRuntimeState(configuration);
    applyThemeVars(themeToCssVars(configuration.theme));
    if (typeof document !== 'undefined') {
      document.documentElement.lang = configuration.locale;
    }
  }, []);

  useEffect(() => {
    applyThemeVars(themeToCssVars(runtime.theme));
    if (typeof document !== 'undefined') {
      document.documentElement.lang = runtime.locale;
    }
  }, [runtime.theme, runtime.locale]);

  const value = useMemo(() => ({ runtime, applyRuntime }), [runtime, applyRuntime]);

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): RuntimeContextValue {
  const value = useContext(RuntimeContext);
  if (!value) {
    throw new Error('useRuntime must be used within RuntimeProvider');
  }
  return value;
}
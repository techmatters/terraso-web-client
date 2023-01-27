import { createContext, useContext } from 'react';

const ConfigContext = createContext();

export const ConfigContextProvider = ConfigContext.Provider;

export const useConfigContext = () => useContext(ConfigContext);

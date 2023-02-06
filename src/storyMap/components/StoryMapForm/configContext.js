import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { v4 as uuidv4 } from 'uuid';

const ConfigContext = createContext();

export const ConfigContextProvider = props => {
  const { children, baseConfig } = props;
  const [config, setConfig] = useState(baseConfig || {});
  const [preview, setPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState({});

  const addMediaFile = useCallback((content, file) => {
    const id = uuidv4();
    setMediaFiles(prev => ({ ...prev, [id]: { content, file } }));
    return id;
  }, []);

  const getMediaFile = useCallback(id => mediaFiles[id]?.content, [mediaFiles]);

  const contextValue = useMemo(
    () => ({
      config,
      setConfig,
      preview,
      setPreview,
      mediaFiles,
      addMediaFile,
      getMediaFile,
    }),
    [config, preview, mediaFiles, addMediaFile, getMediaFile]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => useContext(ConfigContext);

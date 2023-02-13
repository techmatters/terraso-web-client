import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { v4 as uuidv4 } from 'uuid';

const ConfigContext = createContext();

export const ConfigContextProvider = props => {
  const { children, baseConfig } = props;
  const [config, setConfig] = useState(baseConfig || {});
  const [preview, setPreview] = useState(false);
  const [mediaFiles, setMediaFiles] = useState({});
  const init = useRef(false);

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
      init,
    }),
    [config, preview, mediaFiles, addMediaFile, getMediaFile, init]
  );

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => useContext(ConfigContext);

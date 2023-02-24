/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { v4 as uuidv4 } from 'uuid';

const StoryMapConfigContext = createContext();

export const StoryMapConfigContextProvider = props => {
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
    <StoryMapConfigContext.Provider value={contextValue}>
      {children}
    </StoryMapConfigContext.Provider>
  );
};

export const useStoryMapConfigContext = () => useContext(StoryMapConfigContext);

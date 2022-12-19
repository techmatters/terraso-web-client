import React, { useContext } from 'react';

const SharedDataUploadContext = React.createContext();

export const useShareDataUploadContext = () =>
  useContext(SharedDataUploadContext);

export const ShareDataUploadContextProvider = props => {
  const { children, ...other } = props;

  return (
    <SharedDataUploadContext.Provider value={other}>
      {children}
    </SharedDataUploadContext.Provider>
  );
};

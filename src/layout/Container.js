import React, { createContext, useContext, useState } from 'react';

import { Container as BaseContainer } from '@mui/material';

const ContainerContext = createContext({});

export const useContainerContext = containerProps => {
  const { setContainerProps } = useContext(ContainerContext);
  setContainerProps(containerProps);
};

export const ContainerContextProvider = props => {
  const { children } = props;
  const [containerProps, setContainerProps] = useState({});
  return (
    <ContainerContext.Provider value={{ setContainerProps, containerProps }}>
      {children}
    </ContainerContext.Provider>
  );
};

const Container = props => {
  const { containerProps } = useContext(ContainerContext);
  return <BaseContainer {...props} {...containerProps} />;
};

export default Container;

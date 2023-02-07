import React, { createContext, forwardRef, useContext, useState } from 'react';

import { Container as BaseContainer } from '@mui/material';

const ContainerContext = createContext({});

export const useContainerContext = containerProps => {
  const { setContainerProps } = useContext(ContainerContext);

  return {
    setContainerProps,
  };
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

const Container = forwardRef((props, ref) => {
  const { containerProps } = useContext(ContainerContext);
  return <BaseContainer ref={ref} {...containerProps} {...props} />;
});

export default Container;

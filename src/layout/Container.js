import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Container as BaseContainer } from '@mui/material';

const ContainerContext = createContext({});

export const useContainerContext = containerProps => {
  const { setContainerProps } = useContext(ContainerContext);

  useEffect(() => {
    setContainerProps(containerProps);
  }, [containerProps, setContainerProps]);
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
  return <BaseContainer ref={ref} {...props} {...containerProps} />;
});

export default Container;

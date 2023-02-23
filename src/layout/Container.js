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

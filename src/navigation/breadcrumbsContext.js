import React, { useContext, useEffect, useState } from 'react';

const BreadcrumbsContext = React.createContext();

export const BreadcrumbsContextProvider = props => {
  const [breadcrumbsParams, setBreadcrumbsParams] = useState({});

  return (
    <BreadcrumbsContext.Provider
      value={{ breadcrumbsParams, setBreadcrumbsParams }}
    >
      {props.children}
    </BreadcrumbsContext.Provider>
  );
};

export const useBreadcrumbsContext = () => useContext(BreadcrumbsContext);

export const useBreadcrumbsParams = params => {
  const { setBreadcrumbsParams } = useBreadcrumbsContext();
  useEffect(() => setBreadcrumbsParams(params), [params, setBreadcrumbsParams]);
};

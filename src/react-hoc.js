import React from 'react';

// Component with custom partial prop values
export const withProps = (Component, customProps) => props => {
  const componentProps = {
    ...customProps,
    ...props,
  };
  return <Component {...componentProps} />;
};

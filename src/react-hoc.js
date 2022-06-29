import React from 'react';

// Component with custom partial prop values
export const withProps = (Component, customProps) =>
  React.forwardRef((props, ref) => {
    const componentProps = {
      ...customProps,
      ...props,
    };
    return <Component ref={ref} {...componentProps} />;
  });

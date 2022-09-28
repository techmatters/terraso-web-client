import React, { useContext, useState } from 'react';

const FormPropsSetContext = React.createContext();
const FormPropsGetContext = React.createContext();

export const FormContextProvider = props => {
  const { children } = props;
  const [formContext, setFormContext] = useState({});

  return (
    <FormPropsSetContext.Provider value={setFormContext}>
      <FormPropsGetContext.Provider value={formContext}>
        {children}
      </FormPropsGetContext.Provider>
    </FormPropsSetContext.Provider>
  );
};

export const useFormSetContext = () => useContext(FormPropsSetContext);
export const useFormGetContext = () => useContext(FormPropsGetContext);

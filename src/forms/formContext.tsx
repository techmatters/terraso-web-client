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

import React, { Dispatch, SetStateAction, useContext, useState } from 'react';
import { UseFormTrigger } from 'react-hook-form';

// incomplete, just typing what we need to for now
type FormContext = {
  trigger: UseFormTrigger<Record<string, unknown>>;
  isValid: boolean;
};

const FormPropsSetContext = React.createContext<
  Dispatch<SetStateAction<FormContext | {}>> | undefined
>(undefined);
const FormPropsGetContext = React.createContext<FormContext | {}>({});

export const FormContextProvider = ({ children }: React.PropsWithChildren) => {
  const [formContext, setFormContext] = useState<FormContext | {}>({});

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

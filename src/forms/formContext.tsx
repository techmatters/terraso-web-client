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

import { Dispatch, SetStateAction, useContext, useState } from 'react';
import * as React from 'react';
import { UseFormTrigger } from 'react-hook-form';

type FormContext = {
  trigger: UseFormTrigger<Record<string, unknown>>;
  isValid: boolean;
};

// existing code used a pattern of providing an empty object (represented here by Record<string, never>)
// instead of undefined, and changing to undefined breaks things, so let's stick with
// this for now
type FormContextState = FormContext | Record<string, never>;

const FormPropsSetContext = React.createContext<
  Dispatch<SetStateAction<FormContextState>> | undefined
>(undefined);
const FormPropsGetContext = React.createContext<FormContextState>({});

export const FormContextProvider = ({ children }: React.PropsWithChildren) => {
  const [formContext, setFormContext] = useState<FormContextState>({});

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

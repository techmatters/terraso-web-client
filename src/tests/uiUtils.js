/*
 * Copyright © 2023 Technology Matters
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
import { fireEvent, within } from 'tests/utils';

export const changeCombobox = async (parent, name, newValue, isNew = true) => {
  const combobox = parent.getByRole('combobox', {
    name,
  });
  fireEvent.change(combobox, { target: { value: newValue } });

  const optionsList = parent.getByRole('listbox', { name });

  if (isNew) {
    fireEvent.keyDown(combobox, { key: 'Enter' });
  } else {
    const option = within(optionsList).getByRole('option', {
      name: newValue,
    });
    fireEvent.click(option);
  }
};

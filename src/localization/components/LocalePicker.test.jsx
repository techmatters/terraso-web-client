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

import { act, fireEvent, render, screen, within } from 'tests/utils';
import React from 'react';
import _ from 'lodash/fp';
import * as terrasoApi from 'terraso-client-shared/terrasoApi/api';
import useMediaQuery from '@mui/material/useMediaQuery';

import LocalePicker from 'localization/components/LocalePicker';
import i18n from 'localization/i18n';

jest.mock('@mui/material/useMediaQuery');
jest.mock('terraso-client-shared/terrasoApi/api');

const setup = async () => {
  await render(
    <LocalePicker />,
    _.set('account.currentUser.data.email', 'test@email.org', {})
  );
};
beforeEach(() => {
  i18n.changeLanguage('en-US');
});

test('LocalePicker: Use saved preference', async () => {
  useMediaQuery.mockReturnValue(false);
  await render(
    <LocalePicker />,
    _.flow(
      _.set('account.currentUser.data.preferences.language', 'es-ES'),
      _.set('account.currentUser.data.email', 'test@email.org')
    )({})
  );

  expect(screen.getByText('Español')).toBeInTheDocument();
});
test('LocalePicker: Change locale', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    _.set(
      'updateUserPreference.preference',
      { key: 'language', value: 'es-ES' },
      {}
    )
  );
  useMediaQuery.mockReturnValue(false);
  await setup();
  expect(screen.getByText('English')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(
    screen.getByRole('combobox', { name: /Español/i })
  ).toBeInTheDocument();

  const savePreferenceCall = terrasoApi.requestGraphQL.mock.calls[0];
  expect(savePreferenceCall[1]).toStrictEqual({
    input: {
      key: 'language',
      userEmail: 'test@email.org',
      value: 'es-ES',
    },
  });
});
test('LocalePicker: Dont save if no user', async () => {
  useMediaQuery.mockReturnValue(false);
  await render(<LocalePicker />);

  expect(screen.getByText('English')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(
    screen.getByRole('combobox', { name: /Español/i })
  ).toBeInTheDocument();
  expect(terrasoApi.requestGraphQL).toHaveBeenCalledTimes(0);
});
test('LocalePicker: Change locale (small screen)', async () => {
  terrasoApi.requestGraphQL.mockResolvedValue(
    _.set(
      'updateUserPreference.preference',
      { key: 'language', value: 'es-ES' },
      {}
    )
  );
  useMediaQuery.mockReturnValue(true);
  await setup();

  expect(screen.getByText('EN')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /EN/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /ES/i }))
  );
  expect(screen.getByRole('combobox', { name: /ES/i })).toBeInTheDocument();
});

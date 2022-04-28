// prettier-ignore
import { fireEvent, render, screen, within } from 'tests/utils';

import useMediaQuery from '@mui/material/useMediaQuery';
import LocalePicker from 'localization/components/LocalePicker';
import i18n from 'localization/i18n';
import _ from 'lodash/fp';
import React from 'react';
import { act } from 'react-dom/test-utils';
import * as terrasoApi from 'terrasoBackend/api';

jest.mock('@mui/material/useMediaQuery');
jest.mock('terrasoBackend/api');

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
  terrasoApi.request.mockResolvedValue(
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
    fireEvent.mouseDown(screen.getByRole('button', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();

  const savePreferenceCall = terrasoApi.request.mock.calls[0];
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
    fireEvent.mouseDown(screen.getByRole('button', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();
  expect(terrasoApi.request).toHaveBeenCalledTimes(0);
});
test('LocalePicker: Change locale (small screen)', async () => {
  terrasoApi.request.mockResolvedValue(
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
    fireEvent.mouseDown(screen.getByRole('button', { name: /EN/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /ES/i }))
  );
  expect(screen.getByRole('button', { name: /ES/i })).toBeInTheDocument();
});

import React from 'react';
import { act } from 'react-dom/test-utils';
import useMediaQuery from '@mui/material/useMediaQuery';

import i18n from 'localization/i18n';
import { render, screen, fireEvent, within } from 'tests/utils';
import LocalePicker from 'localization/components/LocalePicker';

jest.mock('@mui/material/useMediaQuery');

beforeEach(() => {
  i18n.changeLanguage('en-US');
});

test('LocalePicker: Change locale', async () => {
  useMediaQuery.mockReturnValue(false);
  await render(<LocalePicker />);

  expect(screen.queryByText('English')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('button', { name: /English/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /Español/i }))
  );
  expect(screen.getByRole('button', { name: /Español/i })).toBeInTheDocument();
});
test('LocalePicker: Change locale (small screen)', async () => {
  useMediaQuery.mockReturnValue(true);
  await render(<LocalePicker />);

  expect(screen.queryByText('EN')).toBeInTheDocument();
  await act(async () =>
    fireEvent.mouseDown(screen.getByRole('button', { name: /EN/i }))
  );
  const listbox = within(screen.getByRole('listbox'));
  await act(async () =>
    fireEvent.click(listbox.getByRole('option', { name: /ES/i }))
  );
  expect(screen.getByRole('button', { name: /ES/i })).toBeInTheDocument();
});

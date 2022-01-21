import React from 'react';
import { act } from 'react-dom/test-utils';

import { render, screen } from 'tests/utils';
import * as accountService from 'account/accountService';
import AccountLogin from 'account/components/AccountLogin';

jest.mock('account/accountService');

test('AccountLogin: Display error', async () => {
  accountService.getAuthURLs.mockRejectedValue('Load error');
  await act(async () => render(<AccountLogin />));
  expect(screen.getByText(/Load error/i)).toBeInTheDocument();
});
test('AccountLogin: Display loader', async () => {
  accountService.getAuthURLs.mockReturnValue(new Promise(() => {}));
  await act(async () => render(<AccountLogin />));
  const loader = screen.getByRole('progressbar', { name: '', hidden: true });
  expect(loader).toBeInTheDocument();
});
test('AccountLogin: Display buttons', async () => {
  accountService.getAuthURLs.mockReturnValue(
    Promise.resolve({
      google: 'google.url',
      apple: 'apple.url',
    })
  );
  await act(async () => render(<AccountLogin />));
  expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
});

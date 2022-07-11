import { render, screen } from 'tests/utils';

import React from 'react';

import { fetchAuthURLs } from 'account/accountSlice';

import { useFetchData } from './utils';

const TestComponent = () => {
  useFetchData(fetchAuthURLs);
  return <div></div>;
};

beforeEach(() => {
  global.fetch = jest.fn();
});

test('AsyncThunk: Handle error', async () => {
  global.fetch.mockRejectedValue('Test error');
  await render(<TestComponent />);
  expect(screen.getByText(/Test error/i)).toBeInTheDocument();
});
test('AsyncThunk: Handle multiple errors', async () => {
  global.fetch.mockRejectedValue(['Test error 1', 'Test error 2']);
  await render(<TestComponent />);
  expect(screen.getByText(/Test error 1/i)).toBeInTheDocument();
  expect(screen.getByText(/Test error 2/i)).toBeInTheDocument();
});
test('AsyncThunk: Complex error message', async () => {
  global.fetch.mockRejectedValue({
    content: ['common.unexpected_error'],
    params: { error: 'Unexpected' },
  });
  await render(<TestComponent />);
  expect(
    screen.getByText(
      /Oops, something went wrong. Please try it again in a few minutes. \(Error: Unexpected\)/i
    )
  ).toBeInTheDocument();
});

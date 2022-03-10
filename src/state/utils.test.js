import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { render, screen } from 'tests/utils';
import { fetchAuthURLs } from 'account/accountSlice';

const TestComponent = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchAuthURLs());
  }, [dispatch]);

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

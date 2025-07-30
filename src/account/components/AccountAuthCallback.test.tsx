/*
 * Copyright © 2025 Technology Matters
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

import React from 'react';
import { render } from '@testing-library/react';
import { NavigateFunction, useNavigate, useSearchParams } from 'react-router';
import { setHasAccessTokenAsync } from 'terraso-client-shared/account/accountSlice';
import { getAPIConfig } from 'terraso-client-shared/config';
import { useDispatch } from 'terrasoApi/store';

import AccountAuthCallback from 'account/components/AccountAuthCallback';

// Mock modules
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('terraso-client-shared/account/accountSlice', () => ({
  setHasAccessTokenAsync: jest.fn(),
}));

jest.mock('terraso-client-shared/config', () => ({
  getAPIConfig: jest.fn(),
  setAPIConfig: jest.fn(),
}));

jest.mock('terrasoApi/store', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('config', () => ({
  TERRASO_ENV: 'development',
}));

// Type the mocked functions
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockGetAPIConfig = getAPIConfig as jest.MockedFunction<
  typeof getAPIConfig
>;
const mockSetHasAccessTokenAsync =
  setHasAccessTokenAsync as jest.MockedFunction<typeof setHasAccessTokenAsync>;

// Create mock functions with proper types
const mockNavigate = jest.fn() as jest.MockedFunction<NavigateFunction>;
const mockSetToken = jest.fn() as jest.MockedFunction<
  (name: string, token: string) => void
>;
const mockDispatch = jest.fn() as jest.MockedFunction<(...args: any[]) => any>;

// Mock the config module type
interface MockConfig {
  TERRASO_ENV: string;
}

type AuthState = {
  atoken: string;
  rtoken: string;
  redirectUrl: string;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseNavigate.mockReturnValue(mockNavigate);
  mockUseDispatch.mockReturnValue(mockDispatch as any);
  mockGetAPIConfig.mockReturnValue({
    tokenStorage: {
      setToken: mockSetToken,
      getToken: jest.fn(),
      removeToken: jest.fn(),
    },
    terrasoAPIURL: 'http://localhost:8000',
    graphQLEndpoint: 'graphql/',
    logger: jest.fn(),
  });
  mockSetHasAccessTokenAsync.mockReturnValue(Promise.resolve() as any);
  mockDispatch.mockReturnValue(Promise.resolve({}));
});

test('AccountAuthCallback: Navigate to /account in production', () => {
  (require('config') as MockConfig).TERRASO_ENV = 'production';

  const searchParams = new URLSearchParams();
  const authState: AuthState = {
    atoken: 'access-token',
    rtoken: 'refresh-token',
    redirectUrl: 'groups',
  };
  searchParams.set('state', btoa(JSON.stringify(authState)));
  mockUseSearchParams.mockReturnValue([searchParams, jest.fn()]);

  render(<AccountAuthCallback />);

  expect(mockNavigate).toHaveBeenCalledWith('/account');
  expect(mockSetToken).not.toHaveBeenCalled();
});

test('AccountAuthCallback: Navigate to /account when no state', () => {
  (require('config') as MockConfig).TERRASO_ENV = 'development';

  mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);

  render(<AccountAuthCallback />);

  expect(mockNavigate).toHaveBeenCalledWith('/account');
  expect(mockSetToken).not.toHaveBeenCalled();
});

test('AccountAuthCallback: Process auth tokens in development', () => {
  (require('config') as MockConfig).TERRASO_ENV = 'development';

  const authState: AuthState = {
    atoken: 'access-token-123',
    rtoken: 'refresh-token-456',
    redirectUrl: 'groups/my-group',
  };

  const searchParams = new URLSearchParams();
  searchParams.set('state', btoa(JSON.stringify(authState)));
  mockUseSearchParams.mockReturnValue([searchParams, jest.fn()]);

  render(<AccountAuthCallback />);

  expect(mockSetToken).toHaveBeenCalledWith('atoken', 'access-token-123');
  expect(mockSetToken).toHaveBeenCalledWith('rtoken', 'refresh-token-456');
  expect(mockDispatch).toHaveBeenCalledWith(setHasAccessTokenAsync());
});

test('AccountAuthCallback: Navigate to redirect URL after token setup', async () => {
  (require('config') as MockConfig).TERRASO_ENV = 'development';

  const authState: AuthState = {
    atoken: 'access-token-123',
    rtoken: 'refresh-token-456',
    redirectUrl: 'landscapes/test-landscape',
  };

  const searchParams = new URLSearchParams();
  searchParams.set('state', btoa(JSON.stringify(authState)));
  mockUseSearchParams.mockReturnValue([searchParams, jest.fn()]);

  // Mock the async dispatch to resolve immediately
  mockDispatch.mockResolvedValue({});

  render(<AccountAuthCallback />);

  // Wait for the async operations to complete
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(mockNavigate).toHaveBeenCalledWith('/landscapes/test-landscape', {
    replace: true,
  });
});

test('AccountAuthCallback: Handle malformed state', () => {
  (require('config') as MockConfig).TERRASO_ENV = 'development';

  const searchParams = new URLSearchParams();
  searchParams.set('state', 'invalid-base64');
  mockUseSearchParams.mockReturnValue([searchParams, jest.fn()]);

  // Mock console.error to avoid test output pollution
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(<AccountAuthCallback />);

  expect(mockNavigate).toHaveBeenCalledWith('/account');

  consoleSpy.mockRestore();
});

test('AccountAuthCallback: Handle empty redirect URL', async () => {
  (require('config') as MockConfig).TERRASO_ENV = 'development';

  const authState: AuthState = {
    atoken: 'access-token-123',
    rtoken: 'refresh-token-456',
    redirectUrl: '',
  };

  const searchParams = new URLSearchParams();
  searchParams.set('state', btoa(JSON.stringify(authState)));
  mockUseSearchParams.mockReturnValue([searchParams, jest.fn()]);

  mockDispatch.mockResolvedValue({});

  render(<AccountAuthCallback />);

  await new Promise(resolve => setTimeout(resolve, 0));

  expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
});

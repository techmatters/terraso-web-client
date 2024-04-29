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
import React from 'react';

// import for side effects to ensure config happens before running tests
import 'config';

import { act } from 'react';
import {
  waitFor as baseWaitFor,
  cleanup,
  render as rtlRender,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import createStore from 'terrasoApi/store';

import AppWrappers from 'layout/AppWrappers';
import rules from 'permissions/rules';

import { AXE_TEST_TIMEOUT, JEST_TEST_TIMEOUT, WAIT_FOR_TIMEOUT } from 'config';

import theme from 'theme';

const executeAxe = process.env['TEST_A11Y'] === 'true';

jest.setTimeout(JEST_TEST_TIMEOUT);

// Mock mapbox
jest.mock('gis/mapbox', () => ({}));

// Mock plausible calls
jest.mock('plausible-tracker', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    enableAutoPageviews: jest.fn(),
    trackEvent: jest.fn(),
  }),
}));

// Work around to avoid tests trying to render SVGs
const createElementNSOrig = global.document.createElementNS;
global.document.createElementNS = function (namespaceURI, qualifiedName) {
  if (
    namespaceURI === 'http://www.w3.org/2000/svg' &&
    qualifiedName === 'svg'
  ) {
    const element = createElementNSOrig.apply(this, arguments);
    element.createSVGRect = function () {};
    return element;
  }
  return createElementNSOrig.apply(this, arguments);
};

if (executeAxe) {
  expect.extend(toHaveNoViolations);
  // Added longer timeout to work with the axe expensive tests
  jest.setTimeout(AXE_TEST_TIMEOUT);
}

afterEach(cleanup);

const baseRender = (component, intialState, permissionsRules) => {
  const Wrapper = ({ children }) => (
    <AppWrappers
      store={createStore(intialState)}
      theme={theme}
      permissionsRules={permissionsRules || rules}
    >
      {children}
    </AppWrappers>
  );
  return rtlRender(component, { wrapper: Wrapper });
};

const render = async (component, intialState, permissionsRules) => {
  let renderResult;
  await act(async () => {
    renderResult = baseRender(component, intialState, permissionsRules);
  });
  if (executeAxe) {
    const { container } = renderResult;
    await act(async () => {
      const axeResults = await axe(container);
      expect(axeResults).toHaveNoViolations();
    });
  }
  return renderResult;
};

const waitFor = async (callback, options) =>
  baseWaitFor(callback, { timeout: WAIT_FOR_TIMEOUT, ...options });

// re-export everything
export * from '@testing-library/react';
// override render method
export { render, waitFor };

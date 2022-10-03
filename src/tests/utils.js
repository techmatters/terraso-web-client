import React from 'react';

import { cleanup, render as rtlRender, waitFor as baseWaitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { act } from 'react-dom/test-utils';

import AppWrappers from 'layout/AppWrappers';
import rules from 'permissions/rules';
import createStore from 'state/store';

import { AXE_TEST_TIMEOUT, JEST_TEST_TIMEOUT, WAIT_FOR_TIMEOUT } from 'config';

import theme from 'theme';

const executeAxe = process.env['TEST_A11Y'] === 'true';

jest.setTimeout(JEST_TEST_TIMEOUT);

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
  baseWaitFor(callback, { timeout: WAIT_FOR_TIMEOUT, ...options })

// re-export everything
export * from '@testing-library/react';
// override render method
export { render };

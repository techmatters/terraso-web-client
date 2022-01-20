import React from 'react'
import { render as rtlRender } from '@testing-library/react'

import createStore from 'state/store'
import theme from 'theme'
import rules from 'permissions/rules'
import AppWrappers from 'common/components/AppWrappers'

const render = (component, intialState, permissionsRules) => {
  const Wrapper = ({ children }) => (
    <AppWrappers
      store={createStore(intialState)}
      theme={theme}
      permissionsRules={permissionsRules || rules}
    >
      {children}
    </AppWrappers>
  )
  return rtlRender(component, { wrapper: Wrapper })
}

// re-export everything
/* eslint-disable import/export */
// re-export everything
export * from '@testing-library/react'
// override render method
export { render }

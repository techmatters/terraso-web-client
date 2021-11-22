import React from 'react'
import { render as rtlRender } from '@testing-library/react'

import createStore from 'store'
import theme from 'theme'
import * as localizationService from 'localization/localizationService'
import AppWrappers from 'common/components/AppWrappers'

const render = (component, intialState) => {
  const Wrapper = ({ children }) => (
    <AppWrappers
      store={createStore(intialState)}
      localization={{
        locale: 'en-US',
        messages: localizationService.getLocaleValues('en-US')
      }}
      theme={theme}
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

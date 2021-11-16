import React from 'react'

import * as localizationService from './localizationService'

test('Dashboard: check if rendered', () => {
  const values = localizationService.getLocaleValues('en-US')
  expect(values['dashboard.title']).toBe('Dashboard')
})

test('Dashboard: check if rendered fallback', () => {
  const valuesLocale = localizationService.getLocaleValues('en-AU')
  expect(valuesLocale['dashboard.title']).toBe('Dashboard')

  const valuesLanguage = localizationService.getLocaleValues('en')
  expect(valuesLanguage['dashboard.title']).toBe('Dashboard')
})

test('Dashboard: check if rendered default', () => {
  const valuesLocale = localizationService.getLocaleValues('fr-FR')
  expect(valuesLocale['dashboard.title']).toBe('Dashboard')

  const valuesLanguage = localizationService.getLocaleValues('fr')
  expect(valuesLanguage['dashboard.title']).toBe('Dashboard')
})

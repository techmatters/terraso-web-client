import React from 'react'

import * as localizationService from './localizationService'

test('Localization Service: check if rendered', () => {
  const values = localizationService.getLocaleValues('en-US')
  expect(values['terraso.title']).toBe('Terraso')
})

test('Localization Service: check if rendered fallback', () => {
  const valuesLocale = localizationService.getLocaleValues('en-AU')
  expect(valuesLocale['terraso.title']).toBe('Terraso')

  const valuesLanguage = localizationService.getLocaleValues('en')
  expect(valuesLanguage['terraso.title']).toBe('Terraso')
})

test('Localization Service: check if rendered default', () => {
  const valuesLocale = localizationService.getLocaleValues('fr-FR')
  expect(valuesLocale['terraso.title']).toBe('Terraso')

  const valuesLanguage = localizationService.getLocaleValues('fr')
  expect(valuesLanguage['terraso.title']).toBe('Terraso')
})

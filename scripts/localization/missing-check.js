const { readFile } = require('fs').promises
const path = require('path')
const flat = require('flat')
const _ = require('lodash')

const { filesInFolder } = require('./utils')


const SOURCE_LOCALE = 'en-US'

const LOCALE_FILES_FOLDER = path.join(__dirname, '../../src/localization/locales/')

const getKeys = content => {
  const json = JSON.parse(content)
  const keys = Object.keys(flat(json))
  return keys 
}

const checkMissingKeys = () => readFile(path.join(LOCALE_FILES_FOLDER, `${SOURCE_LOCALE}.json`))
  // Get source locale keys
  .then(sourceContent => getKeys(sourceContent))
  // Get all locale files
  .then(sourceKeys => filesInFolder(LOCALE_FILES_FOLDER)
    .then(localeFiles => localeFiles.map(filePath => readFile(filePath)
      // Process each Locale
      .then(localeContent => getKeys(localeContent))
      // Identify diff with source locale keys
      .then(localeKeys => _.difference(sourceKeys, localeKeys))
      .then(localeDiff => {
        if(_.isEmpty(localeDiff)) {
          return null
        }
        console.log(`Missing keys for ${path.parse(filePath).name}.`, 'Missing:', localeDiff)
        return localeDiff
      })
    ))
  )
  .then(locales => Promise.all(locales))
  .then(results => results.filter(localeResult => !!localeResult))
  .then(results => {
    // Exit with error if missing keys identified
    if (_.isEmpty(results)) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  })

checkMissingKeys()

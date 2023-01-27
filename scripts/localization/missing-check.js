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

const { readFile } = require('fs').promises;
const path = require('path');
const flat = require('flat');
const _ = require('lodash/fp');

const { filesInFolder } = require('./utils');

const SOURCE_LOCALE = 'en-US';

const LOCALE_FILES_FOLDER = path.join(
  __dirname,
  '../../src/localization/locales/'
);

const getKeys = content => {
  const json = JSON.parse(content);
  const keys = Object.keys(flat(json));
  return keys;
};

const checkMissingKeys = () =>
  readFile(path.join(LOCALE_FILES_FOLDER, `${SOURCE_LOCALE}.json`))
    // Get source locale keys
    .then(sourceContent => getKeys(sourceContent))
    // Get all locale files
    .then(sourceKeys =>
      filesInFolder(LOCALE_FILES_FOLDER).then(localeFiles =>
        localeFiles.map(filePath =>
          readFile(filePath)
            // Process each Locale
            .then(localeContent => getKeys(localeContent))
            // Identify diff with source locale keys
            .then(_.difference(sourceKeys))
            .then(localeDiff => {
              if (_.isEmpty(localeDiff)) {
                return null;
              }
              console.log(
                `Missing keys for ${path.parse(filePath).name}.`,
                'Missing:',
                localeDiff
              );
              return localeDiff;
            })
        )
      )
    )
    .then(locales => Promise.all(locales))
    .then(results => results.filter(localeResult => !!localeResult))
    .then(results => {
      // Exit with error if missing keys identified
      if (_.isEmpty(results)) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    });

checkMissingKeys();

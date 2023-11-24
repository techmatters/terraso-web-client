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

import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { gettextToI18next, i18nextToPo } from 'i18next-conv';

import { filesInFolder } from './utils.js';

// Script arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Parameters [po|json]');
  process.exit(1);
}

const transformTo = args[0];

// Util functions
const save = target => result => writeFile(target, result);

// Base transform function
const transform = (process, from, i18Transform) =>
  filesInFolder(new URL(from, import.meta.url))
    .then(files => {
      console.log(
        `${process} transform starting.`,
        'Files:',
        files.map(f => f.pathname)
      );
      return files;
    })
    .then(files =>
      files.map(filePath => {
        const locale = path.parse(filePath.pathname).name;
        return i18Transform(locale, filePath).then(() => locale);
      })
    )
    .then(promises => Promise.all(promises))
    .then(locales =>
      console.log(
        `Finished ${process} transform successfully.`,
        'Locales:',
        locales
      )
    )
    .catch(error => console.error(`Error transforming to ${process}`, error));

// PO transform
const toPoOptions = {
  project: 'Terraso',
};
const toPo = () =>
  transform('PO', '../../src/localization/locales/', (locale, filePath) =>
    i18nextToPo(locale, readFileSync(filePath), toPoOptions).then(
      save(`locales/po/${locale}.po`)
    )
  );

// JSON transform
const toJsonOptions = {};
const toJson = () =>
  transform('JSON', '../../locales/po/', (locale, filePath) =>
    gettextToI18next(locale, readFileSync(filePath), toJsonOptions).then(
      save(`src/localization/locales/${locale}.json`)
    )
  );

// Scripts entry
if (transformTo === 'po') {
  toPo();
}
if (transformTo === 'json') {
  toJson();
}

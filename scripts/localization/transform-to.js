const path = require('path');
const { readFileSync } = require('fs');
const { writeFile } = require('fs').promises;
const { i18nextToPo, gettextToI18next } = require('i18next-conv');

const { filesInFolder } = require('./utils');

// Script arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Parameters [po|json]');
  return;
}

const transformTo = args[0];

// Util functions
const save = target => result => writeFile(target, result);

// Base transform function
const transform = (process, from, i18Transform) =>
  filesInFolder(path.join(__dirname, from))
    .then(files => {
      console.log(`${process} transform starting.`, 'Files:', files);
      return files;
    })
    .then(files =>
      files.map(filePath => {
        const locale = path.parse(filePath).name;
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

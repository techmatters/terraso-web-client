const { readdir } = require('fs').promises;
const path = require('path');

const filesInFolder = dirname =>
  readdir(dirname).then(filenames =>
    filenames.map(filename => path.join(dirname, filename))
  );

module.exports = { filesInFolder };

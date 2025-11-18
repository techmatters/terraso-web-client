/*
 * Copyright © 2025 Technology Matters
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

const path = require('path');

const getClientBundlePath = () => {
  return path.join(__dirname, '../../build/index.html');
};

const serveClientBundle = (res, next) => {
  const indexPath = getClientBundlePath();
  res.status(200).sendFile(indexPath, err => {
    if (err) {
      console.error('Error serving index.html:', err);
      if (next) {
        next(err);
      } else {
        res.status(500).send('Service temporarily unavailable');
      }
    }
  });
};

module.exports = { getClientBundlePath, serveClientBundle };

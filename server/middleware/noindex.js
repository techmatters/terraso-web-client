/*
 * Copyright © 2026 Technology Matters
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

const { matchRoutes } = require('react-router');
const appRoutes = require('../appPaths.cjs');

const noindex = (req, res, next) => {
  req.clientRouteMatch = matchRoutes(appRoutes, req.path);
  const match = req.clientRouteMatch?.at(-1);
  const policy = match?.route.noindex;
  if (typeof policy === 'function' ? policy(match.params) : policy) {
    res.set('X-Robots-Tag', 'noindex');
  }
  next();
};

module.exports = { noindex };

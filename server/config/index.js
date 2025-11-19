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

if (process.env.NODE_ENV !== 'production') {
  const result = require('dotenv').config({ path: '.env.local' });
  if (result.error && result.error.code !== 'ENOENT') {
    console.warn('Error loading .env.local:', result.error.message);
  }
}

// Validate required environment variables
const requiredEnvVars = ['REACT_APP_TERRASO_API_URL', 'REACT_APP_BASE_URL'];
const missingVars = requiredEnvVars.filter(name => !process.env[name]);
if (missingVars.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingVars.join(', ')}`
  );
  process.exit(1);
}
const config = {
  apiUrl: process.env.REACT_APP_TERRASO_API_URL,
  baseUrl: process.env.REACT_APP_BASE_URL,
  port: process.env.PORT || 10000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiTimeout: parseInt(process.env.API_TIMEOUT_MS, 10) || 10000,
};

module.exports = config;

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

const express = require('express');
const path = require('path');

const config = require('./server/config');
const { requestLogger } = require('./server/middleware/logger');
const storyMapRoutes = require('./server/storyMap/routes');

const app = express();

app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'build')));

app.use('/tools/story-maps', storyMapRoutes);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

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
import React from 'react';
import 'config';
import { createRoot } from 'react-dom/client';
import createStore from 'terrasoApi/store';
import AppWrappers from 'layout/AppWrappers';
import reportWebVitals from 'monitoring/reportWebVitals';
import rules from 'permissions/rules';
import theme from 'theme';
import 'index.css';
import App from 'App';

createRoot(document.getElementById('root')).render(
  <AppWrappers store={createStore()} theme={theme} permissionsRules={rules}>
    <App />
  </AppWrappers>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

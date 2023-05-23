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
import createStoreFactory, {
  DispatchFromStoreFactory,
  StateFromStoreFactory,
} from 'terrasoApi/shared/store/store';

import gisReducer from 'gis/gisSlice';
import userHomeReducer from 'home/homeSlice';
import landscapeReducer from 'landscape/landscapeSlice';
import sharedDataReducer from 'sharedData/sharedDataSlice';
import storyMapReducer from 'storyMap/storyMapSlice';
import taxonomiesReducer from 'taxonomies/taxonomiesSlice';

export type AppState = StateFromStoreFactory<typeof createStore>;
export type AppDispatch = DispatchFromStoreFactory<typeof createStore>;

const createStore = createStoreFactory({
  userHome: userHomeReducer,
  landscape: landscapeReducer,
  sharedData: sharedDataReducer,
  taxonomies: taxonomiesReducer,
  gis: gisReducer,
  storyMap: storyMapReducer,
});

export default createStore;

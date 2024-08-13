/*
 * Copyright © 2023 Technology Matters
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

import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash/fp';
import { createAsyncThunk } from 'terraso-client-shared/store/utils';

import i18n from 'localization/i18n';
import * as storyMapService from 'storyMap/storyMapService';

const initialState = {
  form: {
    fetching: true,
    saving: false,
    data: null,
  },
  view: {
    fetching: true,
    data: null,
    deleting: false,
  },
  samples: {
    fetching: true,
    listSamples: [],
  },
  userStoryMaps: {
    fetching: true,
    list: [],
  },
  delete: {},
  memberships: {
    add: {
      saving: false,
    },
    delete: {},
    approve: {},
  },
  dataLayers: {
    fetching: true,
    list: [],
  },
};

export const fetchSamples = createAsyncThunk(
  'storyMap/fetchSamples',
  storyMapService.fetchSamples
);
export const fetchStoryMap = createAsyncThunk(
  'storyMap/fetchStoryMap',
  storyMapService.fetchStoryMap
);
export const fetchStoryMapForm = createAsyncThunk(
  'storyMap/fetchStoryMapForm',
  storyMapService.fetchStoryMap
);
export const addStoryMap = createAsyncThunk(
  'storyMap/addStoryMap',
  storyMapService.addStoryMap,
  (storyMap, { storyMap: { config, published } }) => ({
    severity: 'success',
    content: 'storyMap.added_story_map',
    params: {
      title: config.title,
      context: published ? 'published' : 'draft',
    },
  }),
  true,
  ({ message, input }) =>
    _.set(
      'params.context',
      _.get('storyMap.published', input) ? 'published' : 'draft',
      message
    )
);
export const updateStoryMap = createAsyncThunk(
  'storyMap/updateStoryMap',
  storyMapService.updateStoryMap,
  (storyMap, { storyMap: { config, published } }) => ({
    severity: 'success',
    content: 'storyMap.update_story_map',
    params: {
      title: config.title,
      context: published ? 'published' : 'draft',
    },
  }),
  true,
  ({ message, input }) =>
    _.set(
      'params.context',
      _.get('storyMap.published', input) ? 'published' : 'draft',
      message
    )
);
export const deleteStoryMap = createAsyncThunk(
  'storyMap/deleteStoryMap',
  storyMapService.deleteStoryMap,
  (storyMap, { storyMap: { title } }) => ({
    severity: 'success',
    content: 'storyMap.deleted_story_map',
    params: {
      title,
    },
  })
);
export const addMemberships = createAsyncThunk(
  'storyMap/addMemberships',
  storyMapService.addMemberships,
  (members, { storyMap: { config } }) => ({
    severity: 'success',
    content: 'storyMap.added_memberships',
    params: {
      title: config.title,
      names: members.map(
        membership =>
          membership.pendingEmail ||
          i18n.t('user.full_name', { user: membership.user })
      ),
      count: members.length,
    },
  })
);
export const deleteMembership = createAsyncThunk(
  'storyMap/deleteMembership',
  storyMapService.deleteMembership,
  (result, { isOwnMembership, membership, storyMap }) => ({
    severity: 'success',
    content: isOwnMembership
      ? 'storyMap.left_membership'
      : 'storyMap.deleted_membership',
    params: {
      storyMapTitle: storyMap.title,
      name:
        membership.pendingEmail ||
        i18n.t('user.full_name', { user: membership.user }),
    },
  })
);

export const approveMembershipToken = createAsyncThunk(
  'storyMap/approveMembership',
  storyMapService.approveMembershipToken,
  null,
  false
);

export const approveMembership = createAsyncThunk(
  'storyMap/approveMembership',
  storyMapService.approveMembership,
  ({ storyMap: { title } }) => ({
    severity: 'success',
    content: 'storyMap.approved_membership',
    params: {
      storyMapTitle: title,
    },
  })
);

export const fetchDataLayers = createAsyncThunk(
  'storyMap/fetchDataLayers',
  storyMapService.fetchDataLayers
);

const storyMapSlice = createSlice({
  name: 'storyMap',
  initialState,

  reducers: {
    resetForm: state => ({
      ...state,
      form: initialState.form,
    }),
    removeUserStoryMap: (state, action) => {
      return {
        ...state,
        userStoryMaps: {
          ...state.userStoryMaps,
          list: state.userStoryMaps.list.filter(
            userStoryMap => userStoryMap.id !== action.payload
          ),
        },
      };
    },
    setUserStoryMaps: (state, action) => ({
      ...state,
      userStoryMaps: {
        ...state.userStoryMaps,
        list: action.payload,
      },
    }),
  },

  extraReducers: builder => {
    builder.addCase(fetchSamples.pending, state => ({
      ...state,
      samples: initialState.samples,
      userStoryMaps: initialState.userStoryMaps,
    }));
    builder.addCase(fetchSamples.rejected, state => ({
      ...state,
      samples: {
        fetching: false,
        listSamples: [],
      },
      userStoryMaps: {
        fetching: false,
        list: [],
      },
    }));
    builder.addCase(fetchSamples.fulfilled, (state, action) => ({
      ...state,
      samples: {
        fetching: false,
        listSamples: action.payload.samples,
      },
      userStoryMaps: {
        fetching: false,
        list: action.payload.userStoryMaps,
      },
    }));

    builder.addCase(fetchStoryMap.pending, state => ({
      ...state,
      view: initialState.view,
    }));
    builder.addCase(fetchStoryMap.rejected, state => ({
      ...state,
      view: {
        fetching: false,
      },
    }));
    builder.addCase(fetchStoryMap.fulfilled, (state, action) => ({
      ...state,
      view: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(fetchStoryMapForm.pending, state => ({
      ...state,
      form: initialState.form,
    }));
    builder.addCase(fetchStoryMapForm.rejected, state => ({
      ...state,
      form: {
        fetching: false,
      },
    }));
    builder.addCase(fetchStoryMapForm.fulfilled, (state, action) => ({
      ...state,
      form: {
        fetching: false,
        data: action.payload,
      },
    }));

    builder.addCase(addStoryMap.pending, _.set('form.saving', true));
    builder.addCase(addStoryMap.rejected, _.set('form.saving', false));
    builder.addCase(addStoryMap.fulfilled, _.set('form.saving', false));

    builder.addCase(updateStoryMap.pending, _.set('form.saving', true));
    builder.addCase(updateStoryMap.rejected, _.set('form.saving', false));
    builder.addCase(updateStoryMap.fulfilled, _.set('form.saving', false));

    builder.addCase(deleteStoryMap.pending, (state, action) =>
      _.set(`delete.${action.meta.arg.storyMap.id}.deleting`, true, state)
    );
    builder.addCase(deleteStoryMap.rejected, (state, action) =>
      _.set(`delete.${action.meta.arg.storyMap.id}.deleting`, false, state)
    );
    builder.addCase(deleteStoryMap.fulfilled, (state, action) =>
      _.set(`delete.${action.meta.arg.storyMap.id}.deleting`, false, state)
    );

    builder.addCase(
      addMemberships.pending,
      _.set('memberships.add.saving', true)
    );
    builder.addCase(
      addMemberships.rejected,
      _.set('memberships.add.saving', false)
    );
    builder.addCase(addMemberships.fulfilled, (state, action) => {
      const memberships = [...state.form.data.memberships, ...action.payload];
      const uniqMemberships = _.uniqBy('id', memberships);
      return {
        ...state,
        memberships: {
          ...state.memberships,
          add: {
            saving: false,
          },
        },
        form: {
          ...state.form,
          data: {
            ...state.form.data,
            memberships: uniqMemberships,
          },
        },
      };
    });

    builder.addCase(deleteMembership.pending, (state, action) =>
      _.set(
        `memberships.delete.${action.meta.arg.membership.membershipId}.processing`,
        true,
        state
      )
    );
    builder.addCase(deleteMembership.rejected, (state, action) =>
      _.set(
        `memberships.delete.${action.meta.arg.membership.membershipId}.processing`,
        false,
        state
      )
    );
    builder.addCase(deleteMembership.fulfilled, (state, action) => {
      const memberships = state.form.data.memberships.filter(
        ({ membershipId }) => membershipId !== action.payload.id
      );
      return {
        ...state,
        memberships: {
          ...state.memberships,
          delete: {
            ...state.memberships.delete,
            [action.meta.arg.membership.membershipId]: {
              processing: false,
            },
          },
        },
        form: {
          ...state.form,
          data: {
            ...state.form.data,
            memberships,
          },
        },
      };
    });

    builder.addCase(approveMembership.pending, (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        approve: {
          ...state.memberships.approve,
          [action.meta.arg.membership.membershipId]: {
            processing: true,
          },
        },
      },
    }));
    builder.addCase(approveMembership.rejected, (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        approve: {
          ...state.memberships.approve,
          [action.meta.arg.membership.membershipId]: {
            processing: false,
            error: action.payload,
          },
        },
      },
    }));
    builder.addCase(approveMembership.fulfilled, (state, action) => ({
      ...state,
      memberships: {
        ...state.memberships,
        approve: {
          ...state.memberships.approve,
          [action.meta.arg.membership.membershipId]: {
            processing: false,
            success: true,
            storyMap: action.payload.storyMap,
          },
        },
      },
      userStoryMaps: {
        ...state.userStoryMaps,
        list: state.userStoryMaps.list.map(userStoryMap => {
          if (userStoryMap.id === action.payload.storyMap.id) {
            return action.payload.storyMap;
          }
          return userStoryMap;
        }),
      },
    }));

    builder.addCase(fetchDataLayers.pending, state => ({
      ...state,
      dataLayers: initialState.dataLayers,
    }));
    builder.addCase(fetchDataLayers.rejected, state => ({
      ...state,
      dataLayers: {
        fetching: false,
        list: [],
      },
    }));
    builder.addCase(fetchDataLayers.fulfilled, (state, action) => ({
      ...state,
      dataLayers: {
        fetching: false,
        list: action.payload,
      },
    }));
  },
});

export const { resetForm, removeUserStoryMap, setUserStoryMaps } =
  storyMapSlice.actions;

export default storyMapSlice.reducer;

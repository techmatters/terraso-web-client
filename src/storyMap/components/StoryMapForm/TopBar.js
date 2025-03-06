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

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import {
  Button,
  Divider,
  Grid,
  Link,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';

import RouterLink from 'common/components/RouterLink';
import { generateStoryMapUrl } from 'storyMap/storyMapUtils';

import ShareDialog from './ShareDialog';
import { useStoryMapConfigContext } from './storyMapConfigContext';
import TopBarContainer from './TopBarContainer';

const SAVE_STATUS = {
  saving: {
    message: 'storyMap.form_save_status_saving',
    Icon: SyncIcon,
  },
  saved: {
    message: 'storyMap.form_save_status_saved',
    Icon: CheckIcon,
  },
  error: {
    message: 'storyMap.form_save_status_error',
    Icon: ErrorIcon,
    color: 'error.main',
  },
};

const SaveStatus = props => {
  const { t } = useTranslation();
  const { requestStatus, isDirty } = props;
  const { error } = requestStatus;

  const status = error ? 'error' : isDirty ? 'saving' : 'saved';
  const Icon = SAVE_STATUS[status].Icon;
  const message = SAVE_STATUS[status].message;
  const color = SAVE_STATUS[status].color;

  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ color: color || 'gray.dark1' }}
    >
      <Icon sx={{ fontSize: 20 }} />
      <Typography variant="caption">{t(message)}</Typography>
    </Stack>
  );
};

const ActionsMenu = () => {
  const { t } = useTranslation();
  const { storyMap, setPreview } = useStoryMapConfigContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openShareDialog, setOpenShareDialog] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {storyMap && (
        <ShareDialog
          open={openShareDialog}
          onClose={() => setOpenShareDialog(false)}
        />
      )}
      <Button
        id="actions-menu-button"
        aria-controls={open ? 'actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="outlined"
        disableElevation
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
      >
        {t('storyMap.form_actions_button')}
      </Button>
      <Menu
        id="actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'actions-menu-button',
          },
        }}
      >
        <MenuItem dense onClick={() => setPreview(true)}>
          {t('storyMap.form_preview_button')}
        </MenuItem>
        <Divider />
        {storyMap?.publishedAt && (
          <MenuItem
            dense
            component={Link}
            href={generateStoryMapUrl(storyMap)}
            target="_blank"
          >
            {t('storyMap.form_view_published_button')}
          </MenuItem>
        )}
        {storyMap?.publishedAt && <Divider />}
        {storyMap && (
          <MenuItem dense onClick={() => setOpenShareDialog(true)}>
            {t('storyMap.form_share_button')}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

const TopBar = props => {
  const { t } = useTranslation();
  const { storyMap, config } = useStoryMapConfigContext();
  const { onPublish, isDirty, requestStatus } = props;

  const isPublished = storyMap?.isPublished;

  return (
    <TopBarContainer>
      <Grid
        item
        xs={2}
        sx={{
          width: '100%',
          pl: 2,
        }}
      >
        <RouterLink
          to="/tools/story-maps"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon />
          <Typography sx={{ ml: 1 }}>
            {t('storyMap.form_back_button')}
          </Typography>
        </RouterLink>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="h3" component="h1" sx={{ pt: 0 }}>
          {config.title || t('storyMap.form_no_title_label')}
        </Typography>
      </Grid>
      <Grid
        item
        xs={4}
        sx={{
          pr: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <SaveStatus isDirty={isDirty} requestStatus={requestStatus} />
          <ActionsMenu />
          <Button
            variant="contained"
            color="primary"
            onClick={onPublish}
            sx={{ ml: 2 }}
          >
            {isPublished
              ? t('storyMap.form_republish_button')
              : t('storyMap.form_publish_button')}
          </Button>
        </Stack>
      </Grid>
    </TopBarContainer>
  );
};

export default TopBar;

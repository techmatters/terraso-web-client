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

import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Button, ButtonGroup, Menu, MenuItem } from '@mui/material';

import ConfirmationDialog from 'terraso-web-client/common/components/ConfirmationDialog';
import { useStoryMapConfigDataContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { unpublishStoryMap } from 'terraso-web-client/storyMap/storyMapSlice';

const PublicationButton = ({ onPublish, isPublishing }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storyMap } = useStoryMapConfigDataContext();
  const isUnpublishing = useSelector(
    state => state.storyMap.unpublish?.[storyMap?.id]?.unpublishing || false
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const menuId = useId();
  const optionsId = useId();
  const isPublished = storyMap?.isPublished;
  const disabled = isPublishing || isUnpublishing;

  const confirmUnpublish = async () => {
    const result = await dispatch(unpublishStoryMap({ id: storyMap.id }));
    if (result.meta.requestStatus === 'fulfilled') {
      setConfirming(false);
    }
  };

  return (
    <>
      <ButtonGroup variant="contained" sx={{ ml: 2 }}>
        <Button onClick={onPublish} disabled={disabled}>
          {t(
            isPublished
              ? 'storyMap.form_republish_button'
              : 'storyMap.form_publish_button'
          )}
        </Button>
        {isPublished && (
          <Button
            id={optionsId}
            size="small"
            aria-label={t('storyMap.form_publication_options')}
            aria-haspopup="menu"
            aria-controls={anchorEl ? menuId : undefined}
            aria-expanded={Boolean(anchorEl)}
            disabled={disabled}
            onClick={event => setAnchorEl(event.currentTarget)}
          >
            <ArrowDropDownIcon />
          </Button>
        )}
      </ButtonGroup>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ list: { 'aria-labelledby': optionsId } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setConfirming(true);
          }}
        >
          {t('storyMap.form_unpublish_menu')}
        </MenuItem>
      </Menu>
      <ConfirmationDialog
        open={confirming}
        title={t('storyMap.form_unpublish_confirm_title', {
          name: storyMap?.title,
        })}
        message={t('storyMap.form_unpublish_confirm_message')}
        confirmButtonLabel={t('storyMap.form_unpublish_button')}
        loading={isUnpublishing}
        onConfirm={confirmUnpublish}
        onCancel={() => {
          if (!isUnpublishing) {
            setConfirming(false);
          }
        }}
      />
    </>
  );
};

export default PublicationButton;

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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';

import SocialShare, {
  useSocialShareContext,
} from 'terraso-web-client/common/components/SocialShare';
import { createAbsoluteUrl } from 'terraso-web-client/common/utils/urlUtils';
import FeaturedImage from 'terraso-web-client/storyMap/components/StoryMapForm/FeaturedImage';
import ShareDialog from 'terraso-web-client/storyMap/components/StoryMapForm/ShareDialog';
import ShortDescription from 'terraso-web-client/storyMap/components/StoryMapForm/ShortDescription';
import { useStoryMapConfigContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  generateStoryMapEmbedUrl,
  generateStoryMapUrl,
  getStoryMapStatusLabel,
  isStoryMapPublished,
} from 'terraso-web-client/storyMap/storyMapUtils';

const SIDEBAR_WIDTH = 300;
const SIDEBAR_ICON_SRC = '/storyMap/sidebar-right-collapse.svg';

const ACTION_BUTTON_SX = {
  justifyContent: 'flex-start',
  px: 0,
  fontSize: 16,
  fontWeight: 400,
};

const CollapseButton = ({ onClick, sx }) => {
  const { t } = useTranslation();
  const label = t('storyMap.form_right_sidebar_close');

  return (
    <IconButton
      onClick={onClick}
      aria-label={label}
      size="small"
      sx={theme => ({
        alignSelf: 'flex-end',
        bgcolor: 'white',
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        border: `1px solid ${theme.palette.gray.lite1}`,
        '&:hover': {
          bgcolor: 'gray.lite1',
        },
        ...sx,
      })}
    >
      <Box
        component="img"
        src={SIDEBAR_ICON_SRC}
        alt={label}
        sx={{ width: 20, height: 20 }}
      />
    </IconButton>
  );
};

const PreviewAction = ({ onPreview }) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="text"
      size="small"
      startIcon={<VisibilityOutlinedIcon />}
      onClick={onPreview}
      fullWidth
      sx={ACTION_BUTTON_SX}
    >
      {t('storyMap.form_preview_button')}
    </Button>
  );
};

const PublishedActions = ({ storyMap, onPreview }) => {
  const { t } = useTranslation();

  const published = isStoryMapPublished(storyMap);

  const absoluteUrl = useMemo(
    () => (published ? createAbsoluteUrl(generateStoryMapUrl(storyMap)) : null),
    [storyMap, published]
  );

  if (!storyMap) {
    return null;
  }

  const statusLabel = getStoryMapStatusLabel(storyMap, t);

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontSize: 16, fontWeight: 400 }}>
        {t('storyMap.form_status_label')}: <strong>{statusLabel}</strong>
      </Typography>
      <PreviewAction onPreview={onPreview} />

      {published && (
        <>
          <Button
            component="a"
            href={absoluteUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="text"
            size="small"
            startIcon={<OpenInNewOutlinedIcon />}
            fullWidth
            sx={ACTION_BUTTON_SX}
          >
            {t('storyMap.form_view_published_button')}
          </Button>
          <Stack alignItems="flex-start">
            <SocialShare
              url={absoluteUrl}
              title={storyMap.title}
              buttonProps={{
                variant: 'outlined',
                size: 'small',
                startIcon: <ShareIcon />,
              }}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
};

const ShareAction = ({ storyMap, onShare }) => {
  const { t } = useTranslation();

  if (!storyMap) {
    return null;
  }

  const ownerMembership = storyMap.createdBy
    ? {
        id: 'owner-user-membership',
        user: storyMap.createdBy,
      }
    : null;

  const memberships = _.flow(
    _.compact,
    _.uniqBy(
      membership =>
        membership.user?.id ||
        membership.pendingEmail ||
        membership.membershipId ||
        membership.id
    )
  )([ownerMembership, ...(storyMap.memberships || [])]);

  const getContributorLabel = membership =>
    membership.pendingEmail
      ? membership.pendingEmail
      : t('user.full_name', { user: membership.user });

  const contributors = memberships.map(getContributorLabel).filter(Boolean);

  return (
    <Stack spacing={0.5}>
      <Typography sx={{ fontSize: 16, fontWeight: 400 }}>
        {t('storyMap.form_contributors_label')}:
      </Typography>
      {contributors.map(name => (
        <Typography
          key={name}
          variant="caption"
          sx={{ fontSize: 14, fontWeight: 400 }}
        >
          {name}
        </Typography>
      ))}
      <Button
        variant="text"
        size="small"
        startIcon={<PersonAddAltOutlinedIcon />}
        onClick={onShare}
        fullWidth
        sx={ACTION_BUTTON_SX}
      >
        {t('storyMap.form_invite_contributor_button')}
      </Button>
    </Stack>
  );
};

const RightSidebar = props => {
  const { t } = useTranslation();
  const { open, onClose, zIndex = 3, topOffset = 0 } = props;
  const { storyMap, setPreview } = useStoryMapConfigContext();
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const contentRef = useRef(null);

  useSocialShareContext(
    useMemo(
      () => ({
        name: storyMap?.title,
        pageUrl: storyMap?.publishedAt ? generateStoryMapUrl(storyMap) : null,
        embedUrl: storyMap ? generateStoryMapEmbedUrl(storyMap) : null,
        itemType: 'storyMap.item_type',
      }),
      [storyMap]
    )
  );

  const handlePreview = useCallback(() => {
    setPreview(true);
  }, [setPreview]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const container = contentRef.current;
    if (!container) {
      return;
    }
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [open]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      ModalProps={{ keepMounted: true }}
      transitionDuration={{ enter: 150, exit: 150 }}
      sx={theme => ({
        zIndex,
        width: open ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        overflowX: 'hidden',
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          height: topOffset ? `calc(100% - ${topOffset}px)` : '100%',
          marginTop: topOffset ? `${topOffset}px` : 0,
          borderLeft: `1px solid ${theme.palette.gray.lite1}`,
          boxSizing: 'border-box',
        },
      })}
    >
      <ShareDialog
        open={openShareDialog && Boolean(storyMap)}
        onClose={() => setOpenShareDialog(false)}
      />
      <Box
        role="complementary"
        aria-label={t('storyMap.form_right_sidebar_section_label')}
        ref={contentRef}
        sx={{
          px: 3,
          py: 1,
          height: '100%',
          overflowY: 'auto',
          bgcolor: 'white',
        }}
      >
        <Stack spacing={2} sx={{ my: 1 }}>
          <CollapseButton onClick={onClose} />
          <FeaturedImage />
          <ShortDescription />
          <Divider />
          <PublishedActions storyMap={storyMap} onPreview={handlePreview} />
          <Divider />
          <ShareAction
            storyMap={storyMap}
            onShare={() => setOpenShareDialog(true)}
          />
        </Stack>
      </Box>
    </Drawer>
  );
};

export default RightSidebar;

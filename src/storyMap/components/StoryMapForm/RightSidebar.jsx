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

import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import SocialShare, {
  useSocialShareContext,
} from 'terraso-web-client/common/components/SocialShare';
import {
  createAbsoluteUrl,
  formatUrlForDisplay,
} from 'terraso-web-client/common/utils/urlUtils';
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
};

const SidebarSection = ({ children }) => (
  <Stack spacing={2} sx={{ my: 1 }}>
    {children}
  </Stack>
);

const CollapseButton = ({ onClick, sx }) => {
  const { t } = useTranslation();
  const label = t('storyMap.form_right_sidebar_close');

  return (
    <IconButton
      onClick={onClick}
      aria-label={label}
      size="small"
      sx={theme => ({
        position: 'absolute',
        top: theme.spacing(2),
        right: theme.spacing(2),
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
      onClick={onPreview}
      fullWidth
      sx={ACTION_BUTTON_SX}
    >
      {t('storyMap.form_preview_button')}
    </Button>
  );
};

const PublishedActions = ({ storyMap }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const published = isStoryMapPublished(storyMap);

  const absoluteUrl = useMemo(
    () => (published ? createAbsoluteUrl(generateStoryMapUrl(storyMap)) : null),
    [storyMap, published]
  );

  const displayUrl = useMemo(
    () => (absoluteUrl ? formatUrlForDisplay(absoluteUrl) : ''),
    [absoluteUrl]
  );

  const handleCopyUrl = useCallback(() => {
    if (!absoluteUrl) {
      return;
    }

    navigator.clipboard
      .writeText(absoluteUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy URL to clipboard:', err);
      });
  }, [absoluteUrl]);

  if (!storyMap) {
    return null;
  }

  const statusLabel = getStoryMapStatusLabel(storyMap, t);

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2">
        {t('storyMap.form_status_label')}: <strong>{statusLabel}</strong>
      </Typography>

      {published && (
        <>
          <Typography variant="body2">
            {t('storyMap.form_link_label')}:{' '}
            <Link
              href={absoluteUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ wordBreak: 'break-all' }}
            >
              {displayUrl}
            </Link>{' '}
            <Tooltip
              title={
                copied
                  ? t('storyMap.form_url_copied')
                  : t('storyMap.form_copy_url')
              }
            >
              <IconButton
                size="small"
                onClick={handleCopyUrl}
                aria-label={t('storyMap.form_copy_url')}
                color={copied ? 'success' : 'default'}
              >
                {copied ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Typography>
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
      <Typography>{t('storyMap.form_contributors_label')}:</Typography>
      {contributors.map(name => (
        <Typography key={name} variant="caption">
          {name}
        </Typography>
      ))}
      <Button
        variant="text"
        size="small"
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
  const { open, onClose, container, zIndex = 3, topOffset = 0 } = props;
  const { storyMap, setPreview } = useStoryMapConfigContext();
  const [openShareDialog, setOpenShareDialog] = useState(false);

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
    onClose?.();
    setPreview(true);
  }, [onClose, setPreview]);

  const modalProps = useMemo(
    () => ({
      keepMounted: true,
      ...(container ? { container } : {}),
    }),
    [container]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={modalProps}
      sx={theme => ({
        zIndex,
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
        sx={{
          px: 3,
          py: 1,
          height: '100%',
          overflowY: 'auto',
          bgcolor: 'white',
        }}
      >
        <SidebarSection>
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <PreviewAction onPreview={handlePreview} />
              <CollapseButton onClick={onClose} />
            </Stack>
            <FeaturedImage />
            <ShortDescription />
          </Stack>
          <Divider />
          <PublishedActions storyMap={storyMap} />
          <Divider />
          <ShareAction
            storyMap={storyMap}
            onShare={() => setOpenShareDialog(true)}
          />
        </SidebarSection>
      </Box>
    </Drawer>
  );
};

export default RightSidebar;

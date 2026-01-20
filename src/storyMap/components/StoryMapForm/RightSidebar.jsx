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
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import FeaturedImage from 'terraso-web-client/storyMap/components/StoryMapForm/FeaturedImage';
import ShareDialog from 'terraso-web-client/storyMap/components/StoryMapForm/ShareDialog';
import ShortDescription from 'terraso-web-client/storyMap/components/StoryMapForm/ShortDescription';
import { useStoryMapConfigContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { generateStoryMapUrl } from 'terraso-web-client/storyMap/storyMapUtils';

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

const CollapseButton = ({ onClick, label, sx }) => (
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

const PreviewAction = ({ onPreview, label }) => (
  <Button
    variant="text"
    size="small"
    onClick={onPreview}
    fullWidth
    sx={ACTION_BUTTON_SX}
  >
    {label}
  </Button>
);

const StatusRow = ({ storyMap, label, publishedLabel, draftLabel }) => {
  if (!storyMap) {
    return null;
  }
  const statusLabel = storyMap.publishedAt ? publishedLabel : draftLabel;
  return (
    <Typography variant="caption">
      {label}: <strong>{statusLabel}</strong>
    </Typography>
  );
};

const ViewPublishedAction = ({ storyMap }) => {
  if (!storyMap?.publishedAt) {
    return null;
  }
  const url = generateStoryMapUrl(storyMap);
  return (
    <Typography variant="caption">
      Link:
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          wordBreak: 'break-word',
          ml: 0.5,
        }}
      >
        {url}
      </Link>
    </Typography>
  );
};

const ShareAction = ({
  storyMap,
  onShare,
  label,
  contributorsLabel,
  getContributorLabel,
}) => {
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

  const contributors = memberships.map(getContributorLabel).filter(Boolean);

  return (
    <Stack spacing={0.5}>
      <Typography>{contributorsLabel}:</Typography>
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
        {label}
      </Button>
    </Stack>
  );
};

const RightSidebar = props => {
  const { t } = useTranslation();
  const { open, onClose, container, zIndex = 3, topOffset = 0 } = props;
  const { storyMap, setPreview } = useStoryMapConfigContext();
  const [openShareDialog, setOpenShareDialog] = useState(false);

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
              <PreviewAction
                onPreview={handlePreview}
                label={t('storyMap.form_preview_button')}
              />
              <CollapseButton
                onClick={onClose}
                label={t('storyMap.form_right_sidebar_close')}
              />
            </Stack>
            <FeaturedImage />
            <ShortDescription />
          </Stack>
          <Divider />
          <Stack spacing={1}>
            <StatusRow
              storyMap={storyMap}
              label={t('storyMap.form_status_label')}
              publishedLabel={t('storyMap.form_status_published')}
              draftLabel={t('storyMap.form_status_draft')}
            />
            <ViewPublishedAction storyMap={storyMap} />
          </Stack>
          <Divider />
          <ShareAction
            storyMap={storyMap}
            onShare={() => setOpenShareDialog(true)}
            label={t('storyMap.form_invite_contributor_button')}
            contributorsLabel={t('storyMap.form_contributors_label')}
            getContributorLabel={membership =>
              membership.pendingEmail
                ? membership.pendingEmail
                : t('user.full_name', { user: membership.user })
            }
          />
        </SidebarSection>
      </Box>
    </Drawer>
  );
};

export default RightSidebar;

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Stack } from '@mui/material';

import Button from 'terraso-web-client/common/components/Button';
import ConfirmButton from 'terraso-web-client/common/components/ConfirmButton';
import RouterButton from 'terraso-web-client/common/components/RouterButton';
import SocialShare, {
  SocialShareContextProvider,
  useSocialShareContext,
} from 'terraso-web-client/common/components/SocialShare';
import Restricted from 'terraso-web-client/permissions/components/Restricted';
import DeleteButton from 'terraso-web-client/storyMap/components/StoryMapDeleteButton';
import { STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY } from 'terraso-web-client/storyMap/components/storyMapHomeListItemUtils';
import useStoryMapHomeListItemActions from 'terraso-web-client/storyMap/components/useStoryMapHomeListItemActions';
import {
  generateStoryMapEmbedUrl,
  generateStoryMapUrl,
} from 'terraso-web-client/storyMap/storyMapUtils';

const useConfiguredStoryMapShare = storyMap => {
  const shareConfig = useMemo(
    () => ({
      name: storyMap.title,
      pageUrl: generateStoryMapUrl(storyMap),
      embedUrl: generateStoryMapEmbedUrl(storyMap),
      itemType: 'storyMap.item_type',
    }),
    [storyMap]
  );

  useSocialShareContext(shareConfig);
};

const StoryMapShareContent = ({ storyMap, buttonProps }) => {
  useConfiguredStoryMapShare(storyMap);

  return <SocialShare buttonProps={buttonProps} />;
};

const StoryMapDeleteAction = ({ onDeleteSuccess, storyMap }) => {
  const { t } = useTranslation();

  return (
    <Restricted
      permission="storyMap.delete"
      resource={storyMap}
      FallbackComponent={Box}
    >
      <DeleteButton
        storyMap={storyMap}
        tooltip={t('storyMap.delete_label', { name: storyMap.title })}
        onSuccess={onDeleteSuccess}
      >
        <DeleteIcon />
      </DeleteButton>
    </Restricted>
  );
};

const StoryMapHomeListItemActions = ({
  isStoryMapMembershipPending,
  storyMap,
  storyMapConfig,
}) => {
  const { t } = useTranslation();
  const {
    approvalProcessing,
    editUrl,
    isPublishing,
    onAccept,
    onDeleteSuccess,
    onPublish,
    primaryActionType,
  } = useStoryMapHomeListItemActions({
    isStoryMapMembershipPending,
    storyMap,
    storyMapConfig,
  });
  const primaryAction = {
    accept: {
      label: t('storyMap.home_accept'),
      loading: approvalProcessing,
      render: () => (
        <Button
          size="medium"
          variant="outlined"
          onClick={onAccept}
          loading={approvalProcessing}
        >
          {t('storyMap.home_accept')}
        </Button>
      ),
    },
    share: {
      label: t('share.button'),
      render: () => (
        <SocialShareContextProvider>
          <StoryMapShareContent
            storyMap={storyMap}
            buttonProps={{
              size: 'medium',
              variant: 'outlined',
            }}
          />
        </SocialShareContextProvider>
      ),
    },
    publish: {
      label: t('storyMap.form_publish_button'),
      loading: isPublishing,
      render: () => (
        <ConfirmButton
          onConfirm={onPublish}
          loading={isPublishing}
          confirmTitle={t('storyMap.home_publish_confirm_title', {
            name: storyMap.title,
          })}
          confirmMessage={t('storyMap.home_publish_confirm_message', {
            name: storyMap.title,
          })}
          confirmButton={t('storyMap.home_publish_confirm_button')}
          buttonLabel={t('storyMap.form_publish_button')}
          ariaLabel={t('storyMap.form_publish_button')}
        >
          {t('storyMap.form_publish_button')}
        </ConfirmButton>
      ),
    },
  }[primaryActionType];
  const deleteAction = (
    <Box sx={{ width: 48, flexShrink: 0 }}>
      <StoryMapDeleteAction
        onDeleteSuccess={onDeleteSuccess}
        storyMap={storyMap}
      />
    </Box>
  );

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        flexWrap: 'wrap',
        flexShrink: 0,
        alignSelf: 'stretch',
        width: '100%',
        [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap',
          width: 'auto',
        },
      }}
      spacing={1}
      useFlexGap
    >
      {primaryAction.render()}
      {!isStoryMapMembershipPending && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'flex-start',
            [STORY_MAP_DESKTOP_ACTIONS_MEDIA_QUERY]: {
              columnGap: 2,
            },
          }}
        >
          <RouterButton to={editUrl} size="medium" variant="outlined">
            {t('storyMap.home_edit')}
          </RouterButton>
          {deleteAction}
        </Stack>
      )}
      {isStoryMapMembershipPending && deleteAction}
    </Stack>
  );
};

export default StoryMapHomeListItemActions;

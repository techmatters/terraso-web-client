import { useCallback, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'terraso-web-client/terrasoApi/store';

import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  LANDSCAPE_NARRATIVES,
} from 'terraso-web-client/monitoring/ilm';
import {
  approveMembership,
  removeUserStoryMap,
  updateStoryMap,
  updateUserStoryMap,
} from 'terraso-web-client/storyMap/storyMapSlice';
import { generateStoryMapEditUrl } from 'terraso-web-client/storyMap/storyMapUtils';

const getPrimaryActionType = ({ isStoryMapMembershipPending, storyMap }) => {
  if (isStoryMapMembershipPending) {
    return 'accept';
  }

  return storyMap.isPublished ? 'share' : 'publish';
};

const mergePublishedStoryMap = (storyMap, updatedStoryMap) => ({
  ...storyMap,
  ...updatedStoryMap,
  isPublished: true,
  publishedAt: updatedStoryMap.publishedAt || storyMap.publishedAt,
  config: updatedStoryMap.config || storyMap.config,
});

const useStoryMapHomeListItemActions = ({
  isStoryMapMembershipPending,
  storyMap,
  storyMapConfig,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [isPublishing, setIsPublishing] = useState(false);

  const accountMembership = useMemo(
    () => storyMap.membershipInfo.accountMembership,
    [storyMap.membershipInfo.accountMembership]
  );

  const approvalProcessing = useSelector(
    state =>
      state.storyMap.memberships.approve[accountMembership?.membershipId]
        ?.processing || false
  );

  const primaryActionType = useMemo(
    () => getPrimaryActionType({ isStoryMapMembershipPending, storyMap }),
    [isStoryMapMembershipPending, storyMap]
  );

  const onAccept = useCallback(() => {
    dispatch(
      approveMembership({
        membership: accountMembership,
        storyMap,
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';

      if (!success) {
        return;
      }

      navigate(generateStoryMapEditUrl(data.payload.storyMap));
      trackEvent('storymap.share.accept', {
        props: {
          map: storyMap.id,
        },
      });
    });
  }, [accountMembership, dispatch, navigate, storyMap, trackEvent]);

  const onDeleteSuccess = useCallback(() => {
    dispatch(removeUserStoryMap(storyMap.id));
  }, [dispatch, storyMap.id]);

  const onPublish = useCallback(() => {
    if (!storyMapConfig || isPublishing) {
      return Promise.resolve(false);
    }

    setIsPublishing(true);

    return dispatch(
      updateStoryMap({
        storyMap: {
          id: storyMap.id,
          config: storyMapConfig,
          publish: true,
        },
        files: {},
      })
    )
      .then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';

        if (!success) {
          return false;
        }

        dispatch(
          updateUserStoryMap(mergePublishedStoryMap(storyMap, data.payload))
        );
        trackEvent('storymap.publish', {
          props: {
            [ILM_OUTPUT_PROP]: LANDSCAPE_NARRATIVES,
            map: storyMap.id,
          },
        });

        return true;
      })
      .finally(() => {
        setIsPublishing(false);
      });
  }, [dispatch, isPublishing, storyMap, storyMapConfig, trackEvent]);

  return {
    approvalProcessing,
    editUrl: generateStoryMapEditUrl(storyMap),
    isPublishing,
    onAccept,
    onDeleteSuccess,
    onPublish,
    primaryActionType,
  };
};

export default useStoryMapHomeListItemActions;

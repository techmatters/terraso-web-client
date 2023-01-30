import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import StoryMap from 'storyMap/components/StoryMap';
import { fetchStoryMap } from 'storyMap/storyMapSlice';

const UserStoryMap = () => {
  const { slug } = useParams();
  const { data: storyMap, fetching } = useSelector(_.get('storyMap.view'));

  console.log({ storyMap, fetching });

  useFetchData(useCallback(() => fetchStoryMap({ slug }), [slug]));

  if (fetching) {
    return <PageLoader />;
  }

  return <StoryMap config={storyMap.config} />;
};

export default UserStoryMap;

import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { Link } from '@mui/material';

const StoryMapOutline = props => {
  const { t } = useTranslation();
  const { chapters, onChapterClick } = props;

  if (_.isEmpty(chapters)) {
    return null;
  }

  return (
    <p>
      {t('storyMap.view_title_outline')}:{' '}
      {_.flow(
        _.map(({ chapter, index }) => ({
          index,
          component: (
            <Link
              key={chapter.id}
              href={`#${chapter.id}`}
              onClick={onChapterClick?.(chapter.id)}
            >
              {chapter.title ||
                t('storyMap.outline_no_title', { index: index + 1 })}
            </Link>
          ),
        })),
        _.flatMap(({ component, index }) => [
          component,
          index !== chapters.length - 1 ? (
            <span key={`divider-${index}`}> | </span>
          ) : undefined,
        ])
      )(chapters)}
    </p>
  );
};

export default StoryMapOutline;

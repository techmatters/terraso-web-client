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

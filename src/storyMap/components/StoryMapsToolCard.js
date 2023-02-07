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
import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import LaunchIcon from '@mui/icons-material/Launch';
import { Button, Card, Stack, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExternalLink from 'common/components/ExternalLink';
import RouterLink from 'common/components/RouterLink';

import theme from 'theme';

const StoryMapToolCard = () => {
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const toolTitle = t(`tools.storyMap.title`);

  return (
    <Card component="li" aria-labelledby={`item-title-story-map`} sx={{ p: 2 }}>
      <RouterLink to="/tools/story-maps">
        <Typography id={`item-title-story-map`} variant="h2">
          {toolTitle}
        </Typography>
      </RouterLink>
      <Stack
        direction={isSmall ? 'column' : 'row'}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack component="section">
          <Typography variant="h3">{t('storyMap.tool_is_for')}</Typography>
          <Typography>{t(`storyMap.tool_description`)}</Typography>

          <Typography variant="h3">{t('tool.requirements')}</Typography>
          <Typography>{t(`storyMap.tool_requirements`)}</Typography>

          <ExternalLink
            href={t(`storyMap.tool_help_url`)}
            linkProps={{ sx: { mt: 3, mb: 3 } }}
          >
            {t('storyMap.tool_help')}
          </ExternalLink>

          <Button
            component={Link}
            to="/tools/story-maps/create"
            variant="outlined"
          >
            {t('storyMap.tool_create_button')}
          </Button>
        </Stack>

        <section>
          <ExternalLink href={t(`tools.storyMap.url`)}>
            <img
              alt=""
              height={t(`tools.storyMap.img.height`)}
              width={t(`tools.storyMap.img.width`)}
              src={t(`tools.storyMap.img.src`)}
            />
            <p>
              {t('tool.go_to', { tool: toolTitle })}
              <LaunchIcon
                sx={{
                  paddingLeft: '5px',
                  height: '1.2rem',
                  width: '1.2rem',
                  verticalAlign: 'bottom',
                }}
              />
            </p>
          </ExternalLink>
        </section>
      </Stack>
    </Card>
  );
};

export default StoryMapToolCard;

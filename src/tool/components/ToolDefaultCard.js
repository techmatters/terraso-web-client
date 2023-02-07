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

import LaunchIcon from '@mui/icons-material/Launch';
import { Card, Stack, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExternalLink from 'common/components/ExternalLink';

import theme from 'theme';

const Tool = ({ tool }) => {
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const toolTitle = t(`tools.${tool}.title`);

  return (
    <Card component="li" aria-labelledby={`item-title-${tool}`} sx={{ p: 2 }}>
      <Typography id={`item-title-${tool}`} variant="h2">
        {toolTitle}
      </Typography>
      <Stack
        direction={isSmall ? 'column' : 'row'}
        justifyContent="space-between"
        spacing={2}
      >
        <section>
          <Typography variant="h3">{t('tool.is_for')}</Typography>
          <Typography>{t(`tools.${tool}.description`)}</Typography>

          <Typography variant="h3">{t('tool.requirements')}</Typography>
          <Typography>{t(`tools.${tool}.requirements`)}</Typography>

          <Typography variant="h3">{t('tool.avilability')}</Typography>
          <Typography>{t(`tools.${tool}.availability`)}</Typography>
        </section>

        <section>
          <ExternalLink href={t(`tools.${tool}.url`)}>
            <img
              alt=""
              height={t(`tools.${tool}.img.height`)}
              width={t(`tools.${tool}.img.width`)}
              src={t(`tools.${tool}.img.src`)}
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

export default Tool;

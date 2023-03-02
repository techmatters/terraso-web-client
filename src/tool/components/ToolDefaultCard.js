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
import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import LaunchIcon from '@mui/icons-material/Launch';
import { Box, Card, Stack, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExternalLink from 'common/components/ExternalLink';

import theme from 'theme';

const Tool = ({ tool }) => {
  const { t } = useTranslation();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const toolTitle = t(`tools.${tool}.title`);
  const toolDescription = t(`tools.${tool}.description`, {
    returnObjects: true,
  });
  const learnMoreUrl = t(`tools.${tool}.learn_more_url`, { defaultValue: '' });
  const pronunciation = t(`tools.${tool}.pronunciation`, { defaultValue: '' });

  const attributes = { variant: 'h2' };
  if (pronunciation) {
    attributes['aria-label'] = pronunciation;
  }

  return (
    <React.Fragment>
      <Card sx={{ padding: theme.spacing(2) }}>
        <Typography {...attributes}>{toolTitle}</Typography>
        <Stack
          direction={isSmall ? 'column' : 'row'}
          justifyContent="space-between"
          spacing={2}
        >
          <section>
            <Typography variant="h3">{t('tool.description')}</Typography>
            {_.isArray(toolDescription) ? (
              <ul style={{ paddingLeft: '1em', marginTop: '0.25em' }}>
                {toolDescription.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <Typography>{toolDescription}</Typography>
            )}

            <Typography variant="h3">{t('tool.requirements')}</Typography>
            <Typography>{t(`tools.${tool}.requirements`)}</Typography>

            {learnMoreUrl && (
              <Typography sx={{ mt: '1em' }}>
                <ExternalLink href={learnMoreUrl}>
                  {t('tool.learn_more', { tool: toolTitle })}
                  <LaunchIcon
                    sx={{
                      paddingLeft: '5px',
                      height: '1.2rem',
                      width: '1.2rem',
                      verticalAlign: '-0.2rem',
                    }}
                  />
                </ExternalLink>
              </Typography>
            )}
          </section>

          <section>
            <ExternalLink href={t(`tools.${tool}.url`)}>
              <Box
                component="img"
                src={t(`tools.${tool}.img.src`)}
                alt=""
                width={t(`tools.${tool}.img.width`)}
                height={t(`tools.${tool}.img.height`)}
                sx={{
                  width: `${t(`tools.${tool}.img.width`)}px`,
                  height: `${t(`tools.${tool}.img.height`)}px`,
                }}
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
    </React.Fragment>
  );
};

export default Tool;

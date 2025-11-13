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
import {
  Box,
  Card,
  Link,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import ExternalLink from 'common/components/ExternalLink';

import theme from 'theme';

const ToolIconAndLink = ({ tool, title, external }) => {
  const { t } = useTranslation();
  const toolImage = require(`assets/${t(`tools.${tool}.img.src`)}`);
  const toolUrl = t(`tools.${tool}.url`);
  const toolText = t('tool.go_to', { tool: title });
  const toolIcon = (
    <Box
      component="img"
      src={toolImage}
      alt={t(`tools.${tool}.img.alt`)}
      width={t(`tools.${tool}.img.width`)}
      height={t(`tools.${tool}.img.height`)}
      sx={{
        width: `${t(`tools.${tool}.img.width`)}px`,
        height: `${t(`tools.${tool}.img.height`)}px`,
        borderRadius: '4px',
        border: '1px solid rgba(0, 0, 0, 0.12)',
      }}
    />
  );
  const LinkComponent = external ? ExternalLink : Link;

  return (
    <React.Fragment>
      <LinkComponent href={toolUrl}>{toolIcon}</LinkComponent>
      <p>
        <LinkComponent href={toolUrl}>
          {toolText}
          {external && (
            <LaunchIcon
              aria-label={t('common.external_link')}
              sx={{
                paddingLeft: 1,
                height: '1.2rem',
                width: '1.2rem',
                verticalAlign: 'bottom',
                color: theme.palette.link,
              }}
            />
          )}
        </LinkComponent>
      </p>
    </React.Fragment>
  );
};

const ToolCard = ({ tool }) => {
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

  const external = t(`tools.${tool}.external`) === 'true';
  const LinkComponent = external ? ExternalLink : Link;

  return (
    <React.Fragment>
      <Card sx={{ padding: 2, paddingTop: 0 }}>
        <Typography {...attributes}>{toolTitle}</Typography>
        <Stack
          direction={isSmall ? 'column' : 'row'}
          justifyContent="space-between"
          spacing={2}
        >
          <section>
            <Typography variant="h3">{t('tool.description')}</Typography>
            {_.isArray(toolDescription) ? (
              <List
                sx={{
                  listStyle: 'disc',
                  pl: 2,
                  pt: 0,
                  mt: 0,
                }}
              >
                {toolDescription.map((item, index) => (
                  <ListItem
                    sx={{ display: 'list-item', pl: 0, pb: 0 }}
                    key={index}
                  >
                    {item}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>{toolDescription}</Typography>
            )}

            <Typography variant="h3">{t('tool.requirements')}</Typography>
            <Typography>{t(`tools.${tool}.requirements`)}</Typography>

            {learnMoreUrl && (
              <Typography sx={{ mt: '1em' }}>
                <LinkComponent href={learnMoreUrl}>
                  {t('tool.learn_more', { tool: toolTitle })}
                  {external && (
                    <LaunchIcon
                      sx={{
                        paddingLeft: 1,
                        height: '1.2rem',
                        width: '1.2rem',
                        verticalAlign: '-0.2rem',
                      }}
                    />
                  )}
                </LinkComponent>
              </Typography>
            )}
          </section>

          <section>
            <ToolIconAndLink
              tool={tool}
              title={toolTitle}
              external={external}
            />
          </section>
        </Stack>
      </Card>
    </React.Fragment>
  );
};

export default ToolCard;

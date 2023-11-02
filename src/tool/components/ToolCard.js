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
import _ from 'lodash/fp.js';
import { useTranslation } from 'react-i18next';
import LaunchIcon from '@mui/icons-material/Launch.js';
import {
  Box,
  Card,
  Link,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery/index.js';

import ExternalLink from 'common/components/ExternalLink.js';

import theme from 'theme';

const ToolIconAndLink = ({ tool, title, external }) => {
  const { t } = useTranslation();
  const toolImage = require(`assets/${t(`tools.${tool}.img.src`)}`);

  return (
    <React.Fragment>
      <Box
        component="img"
        src={toolImage}
        alt=""
        width={t(`tools.${tool}.img.width`)}
        height={t(`tools.${tool}.img.height`)}
        sx={{
          width: `${t(`tools.${tool}.img.width`)}px`,
          height: `${t(`tools.${tool}.img.height`)}px`,
        }}
      />
      <p>
        {t('tool.go_to', { tool: title })}
        {external && (
          <LaunchIcon
            sx={{
              paddingLeft: 1,
              height: '1.2rem',
              width: '1.2rem',
              verticalAlign: 'bottom',
            }}
          />
        )}
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

  const isToolExternal = t(`tools.${tool}.external`) === 'true';

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
                {isToolExternal ? (
                  <ExternalLink href={learnMoreUrl}>
                    {t('tool.learn_more', { tool: toolTitle })}
                    <LaunchIcon
                      sx={{
                        paddingLeft: 1,
                        height: '1.2rem',
                        width: '1.2rem',
                        verticalAlign: '-0.2rem',
                      }}
                    />
                  </ExternalLink>
                ) : (
                  <Link href={t('tool.learn_more')}>
                    {t('tool.learn_more', { tool: toolTitle })}
                  </Link>
                )}
              </Typography>
            )}
          </section>

          <section>
            {isToolExternal ? (
              <ExternalLink href={t(`tools.${tool}.url`)}>
                <ToolIconAndLink
                  tool={tool}
                  title={toolTitle}
                  external={isToolExternal}
                />
              </ExternalLink>
            ) : (
              <Link href={t(`tools.${tool}.url`)}>
                <ToolIconAndLink
                  tool={tool}
                  title={toolTitle}
                  external={isToolExternal}
                />
              </Link>
            )}
          </section>
        </Stack>
      </Card>
    </React.Fragment>
  );
};

export default ToolCard;

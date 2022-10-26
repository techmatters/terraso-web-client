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
    <React.Fragment>
      <Card sx={{ padding: theme.spacing(2) }}>
        <Typography variant="h2">{toolTitle}</Typography>
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
    </React.Fragment>
  );
};

export default Tool;

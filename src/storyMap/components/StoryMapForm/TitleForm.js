import React, { useCallback, useMemo } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { Box, Link, Stack } from '@mui/material';

import EditableText from './EditableText';
import { useConfigContext } from './configContext';

const TitleForm = props => {
  const { t } = useTranslation();
  const { setConfig } = useConfigContext();
  const { config } = props;

  const onFieldChange = useCallback(
    field => value => {
      setConfig(config => ({
        ...config,
        [field]: value,
      }));
    },
    [setConfig]
  );

  const inputProps = useMemo(
    () => ({
      inputProps: {
        style: {
          textAlign: 'center',
        },
      },
    }),
    []
  );

  const chapters = useMemo(
    () =>
      config.chapters.map((chapter, index) => ({
        chapter,
        index,
      })),
    [config.chapters]
  );

  const outline = useMemo(
    () => (
      <p>
        {t('storyMap.view_title_outline')}:{' '}
        {_.flow(
          _.map(({ chapter, index }) => ({
            index,
            component: (
              <Link key={chapter.id} href={`#${chapter.id}`}>
                {chapter.title}
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
    ),
    [chapters, t]
  );

  return (
    <Box id="header" className="step step-container active fully title">
      <Stack className={`${config.theme} step-content`} spacing={1}>
        <EditableText
          placeholder={t('storyMap.form_title_placeholder')}
          Component="h1"
          value={config.title}
          onChange={onFieldChange('title')}
          inputProps={inputProps}
        />
        <EditableText
          placeholder={t('storyMap.form_subtitle_placeholder')}
          Component="h2"
          value={config.subtitle}
          onChange={onFieldChange('subtitle')}
          inputProps={inputProps}
        />
        <EditableText
          placeholder={t('storyMap.form_byline_placeholder')}
          Component="p"
          value={config.byline}
          onChange={onFieldChange('byline')}
          inputProps={inputProps}
        />
        {outline}
      </Stack>
    </Box>
  );
};

export default TitleForm;

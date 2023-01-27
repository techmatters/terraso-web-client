import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { Box, Stack } from '@mui/material';

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

  return (
    <Box id="header" className="step fully title">
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
      </Stack>
    </Box>
  );
};

export default TitleForm;

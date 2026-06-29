/*
 * Copyright © 2026 Technology Matters
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

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ButtonBase,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import {
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import {
  DEFAULT_STORY_MAP_THEME,
  resolveStoryMapThemeId,
  STORY_MAP_THEME_OPTIONS,
} from 'terraso-web-client/storyMap/storyMapThemeUtils';

const PREVIEW_SIZES = {
  collapsed: {
    width: 86,
    height: 26,
    radius: 4,
    rectangleWidth: 32,
    rectangleHeight: 15,
    rectangleRadius: 4,
    circleSize: 15,
    paddingX: 1,
  },
  expanded: {
    width: 171,
    height: 51,
    radius: 8,
    rectangleWidth: 64,
    rectangleHeight: 30,
    rectangleRadius: 8,
    circleSize: 30,
    paddingX: 1,
  },
};

const ThemePreview = ({ option, size }) => {
  const dimensions = PREVIEW_SIZES[size];

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      aria-hidden="true"
      sx={{
        height: dimensions.height,
        borderRadius: `${dimensions.radius}px`,
        border: '1px solid',
        borderColor: 'gray.mid',
        bgcolor: option.background,
        px: dimensions.paddingX,
      }}
    >
      <Box
        sx={{
          width: dimensions.rectangleWidth,
          height: dimensions.rectangleHeight,
          borderRadius: `${dimensions.rectangleRadius}px`,
          bgcolor: option.text,
        }}
      />
      <Box
        sx={{
          width: dimensions.circleSize,
          height: dimensions.circleSize,
          borderRadius: '50%',
          bgcolor: option.link,
        }}
      />
      <Box
        sx={{
          width: dimensions.circleSize,
          height: dimensions.circleSize,
          borderRadius: '50%',
          bgcolor: option.highlight,
        }}
      />
    </Stack>
  );
};

const StoryThemeSelector = () => {
  const { t } = useTranslation();
  const contentId = useId();
  const labelId = useId();
  const { config } = useStoryMapConfigDataContext();
  const { setConfig } = useStoryMapConfigActionsContext();
  const [isPending, startUiTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [pendingThemeId, setPendingThemeId] = useState(null);
  const toggleButtonRef = useRef(null);
  const selectedRadioRef = useRef(null);
  const shouldRestoreFocusRef = useRef(false);

  const selectedThemeId =
    resolveStoryMapThemeId(config) || DEFAULT_STORY_MAP_THEME;

  const selectedTheme = useMemo(
    () =>
      STORY_MAP_THEME_OPTIONS.find(option => option.id === selectedThemeId) ||
      STORY_MAP_THEME_OPTIONS[0],
    [selectedThemeId]
  );

  useEffect(() => {
    if (pendingThemeId === null) {
      return;
    }

    if (pendingThemeId === selectedThemeId) {
      setPendingThemeId(null);
      shouldRestoreFocusRef.current = true;
      setExpanded(false);
    }
  }, [pendingThemeId, selectedThemeId]);

  useEffect(() => {
    if (!expanded) {
      if (shouldRestoreFocusRef.current) {
        shouldRestoreFocusRef.current = false;
        toggleButtonRef.current?.focus();
      }

      return;
    }

    selectedRadioRef.current?.focus();
  }, [expanded, selectedThemeId]);

  const onToggleExpanded = useCallback(() => {
    setExpanded(currentExpanded => !currentExpanded);
  }, []);

  const onThemeSelect = useCallback(
    event => {
      const themeId = event.target.value;

      setPendingThemeId(themeId);
      startUiTransition(() => {
        setConfig(_.set('themeId', themeId));
      });
    },
    [setConfig, startUiTransition]
  );

  const onRadioGroupKeyDown = useCallback(event => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    shouldRestoreFocusRef.current = true;
    setExpanded(false);
  }, []);

  return (
    <Stack aria-busy={isPending} sx={{ bgcolor: 'gray.lite2' }}>
      <ButtonBase
        ref={toggleButtonRef}
        onClick={onToggleExpanded}
        disabled={isPending}
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={`Theme selector. Selected ${selectedTheme.label}. ${selectedTheme.colorsLabel}`}
        sx={{
          width: '100%',
          borderRadius: 0,
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          pt: 4,
        }}
      >
        <Typography
          id={labelId}
          sx={{ fontSize: 16, fontWeight: 400, color: 'link' }}
        >
          {t('storyMap.form_theme_label', { defaultValue: 'Theme' })}
        </Typography>
        <ThemePreview option={selectedTheme} size="collapsed" />
      </ButtonBase>

      <LinearProgress
        aria-hidden={!isPending}
        {...(isPending ? {} : { variant: 'determinate', value: 0 })}
        sx={{
          height: 2,
          opacity: isPending ? 1 : 0,
          transition: 'opacity 120ms linear',
          my: 1,
        }}
      />

      {expanded && (
        <RadioGroup
          id={contentId}
          aria-labelledby={labelId}
          value={selectedTheme.id}
          onChange={onThemeSelect}
          onKeyDown={onRadioGroupKeyDown}
          sx={{ p: 2, pt: 0, gap: 2 }}
        >
          {STORY_MAP_THEME_OPTIONS.map(option => {
            return (
              <FormControlLabel
                key={option.id}
                value={option.id}
                disabled={isPending}
                control={
                  <Radio
                    inputRef={
                      option.id === selectedTheme.id ? selectedRadioRef : null
                    }
                    inputProps={{
                      'aria-label': `${option.label}. ${option.colorsLabel}`,
                    }}
                    sx={visuallyHidden}
                  />
                }
                label={
                  <>
                    <ThemePreview option={option} size="expanded" />
                  </>
                }
                sx={{
                  m: 0,
                  justifyContent: 'center',
                  '& .MuiRadio-root.Mui-focusVisible + .MuiFormControlLabel-label > .MuiStack-root':
                    {
                      outline: theme => `2px solid ${theme.palette.blue.dark}`,
                      outlineOffset: '3px',
                      borderRadius: '2px',
                    },
                  '& .MuiFormControlLabel-label': {
                    display: 'flex',
                  },
                }}
              />
            );
          })}
        </RadioGroup>
      )}
    </Stack>
  );
};

export default StoryThemeSelector;

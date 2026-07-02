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

import { forwardRef } from 'react';
import { Button as MuiButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const BASE_STYLES = {
  display: 'inline-flex',
  minWidth: 0,
  justifyContent: 'center',
  alignItems: 'center',
  '& .MuiButton-startIcon, & .MuiButton-endIcon': {
    margin: 0,
  },
};

const getVariantStyles = (variant, tone, buttonTokens, buttonFocusOutline) => {
  switch (variant) {
    case 'outlined':
      return {
        color: tone.main,
        backgroundColor: '#FFFFFF',
        border: `1px solid ${tone.main}`,
        '&:hover': {
          color: tone.main,
          backgroundColor: tone.subtle,
          border: `1px solid ${tone.main}`,
        },
        '&.Mui-focusVisible': {
          ...buttonFocusOutline,
          color: tone.main,
          backgroundColor: '#FFFFFF',
          border: `1px solid ${tone.main}`,
        },
        '&.Mui-disabled': {
          color: tone.disabled,
          backgroundColor: '#FFFFFF',
          border: `1px solid ${tone.disabled}`,
        },
      };
    case 'text':
      return {
        color: tone.main,
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        '&:hover': {
          color: tone.main,
          backgroundColor: tone.subtle,
          border: '1px solid transparent',
        },
        '&.Mui-focusVisible': {
          ...buttonFocusOutline,
          color: tone.main,
          backgroundColor: 'transparent',
          border: '1px solid transparent',
        },
        '&.Mui-disabled': {
          color: tone.disabled,
          border: '1px solid transparent',
        },
      };
    case 'contained':
    default:
      return {
        color: tone.contrastText,
        backgroundColor: tone.main,
        '&:hover': {
          backgroundColor: tone.hover,
          boxShadow: buttonTokens.containedHoverShadow,
        },
        '&.Mui-focusVisible': {
          ...buttonFocusOutline,
          color: tone.contrastText,
          backgroundColor: tone.main,
        },
        '&.Mui-disabled': {
          color: tone.contrastText,
          backgroundColor: tone.main,
          opacity: 0.4,
        },
      };
  }
};

const Button = forwardRef(
  (
    { color = 'primary', size = 'medium', sx, variant = 'contained', ...props },
    ref
  ) => {
    const theme = useTheme();
    const tone =
      theme.buttonTokens.tones[color] || theme.buttonTokens.tones.primary;
    const sizeStyles =
      theme.buttonTokens.sizes[size] || theme.buttonTokens.sizes.medium;

    return (
      <MuiButton
        ref={ref}
        variant={variant}
        sx={[
          BASE_STYLES,
          theme.buttonTokens.base,
          sizeStyles,
          getVariantStyles(
            variant,
            tone,
            theme.buttonTokens,
            theme.buttonTokens.buttonFocusOutline
          ),
          sx,
        ]}
        {...props}
      />
    );
  }
);

export default Button;

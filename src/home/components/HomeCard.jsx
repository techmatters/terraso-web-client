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

import {
  Box,
  Card,
  CardActions,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import CardActionRouterLink from 'terraso-web-client/common/components/CardActionRouterLink';
import HelperText from 'terraso-web-client/common/components/HelperText';
import RouterButton from 'terraso-web-client/common/components/RouterButton';
import RouterLink from 'terraso-web-client/common/components/RouterLink';

const HomeCard = ({
  title,
  action,
  image,
  children,
  helperText,
  showActionAsButton = false,
  titleId,
  contentBackgroundColor = 'blue.lite2',
}) => (
  <Card
    component="section"
    aria-labelledby={titleId}
    sx={{
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Stack direction="column" sx={{ p: 2 }}>
      <Stack direction="row">
        <Typography
          id={titleId}
          variant="h2"
          sx={{ pt: 0, pb: 2, textTransform: 'uppercase' }}
        >
          {title}
        </Typography>
        {helperText && (
          <Box sx={{ alignItems: 'center' }}>
            <HelperText i18nKey={helperText} />
          </Box>
        )}
      </Stack>
      <Stack
        direction="row"
        spacing={2}
        height={image ? 'auto' : null}
        sx={{
          backgroundColor: contentBackgroundColor,
          borderRadius: '4px',
        }}
      >
        {image && (
          <RouterLink to={image.to}>
            <Stack sx={{ position: 'relative' }}>
              <Paper
                variant="outlined"
                component="img"
                src={image.src}
                alt={image.alt}
                to={image.to}
                height={128}
                sx={{
                  borderRadius: '4px 0px 0px 4px',
                  borderWidth: 0,
                }}
              />
              {image.caption && (
                <Box
                  sx={{
                    color: 'white',
                    background: 'transparent',
                    position: 'absolute',
                    bottom: 1,
                    right: 4.5,
                    pr: 1,
                  }}
                  spacing={2}
                >
                  <Typography variant="caption" aria-hidden="true">
                    {image.caption}
                  </Typography>
                </Box>
              )}
            </Stack>
          </RouterLink>
        )}
        {children}
      </Stack>
    </Stack>
    {action &&
      (showActionAsButton ? (
        <CardActions sx={{ justifyContent: 'center' }}>
          <RouterButton
            variant="contained"
            size="medium"
            sx={{ color: 'white' }}
            to={action.to}
            state={action.pathState}
          >
            {action.label}
          </RouterButton>
        </CardActions>
      ) : (
        <>
          <Divider aria-hidden="false" />
          <CardActionRouterLink
            label={action.label}
            to={action.to}
            state={action.pathState}
          />
        </>
      ))}
  </Card>
);

export default HomeCard;

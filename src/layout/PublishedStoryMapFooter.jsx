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

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { Box, Link, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { visuallyHidden } from '@mui/utils';

import Button from 'terraso-web-client/common/components/Button';
import RouterLink from 'terraso-web-client/common/components/RouterLink';
import { getFooterLinks } from 'terraso-web-client/layout/footerUtils';
import LocalePicker from 'terraso-web-client/localization/components/LocalePicker';

import theme from 'terraso-web-client/theme';

const { spacing, palette } = theme;

const PublishedStoryMapFooterLink = ({ link, showBorder }) => {
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
      <Link
        variant="body1"
        underline="none"
        {...(link.to
          ? { component: RouterLink, to: link.to }
          : { href: link.url })}
        sx={{
          color: palette.white,
          whiteSpace: 'nowrap',
          ...(showBorder
            ? {
                borderRight: `1px solid ${palette.gray.mid2}`,
                paddingRight: spacing(2),
                marginRight: spacing(2),
              }
            : {}),
          '&:hover': {
            textDecoration: 'underline',
          },
        }}
      >
        {link.text}
      </Link>
    </Box>
  );
};

const PublishedStoryMapFooterLinks = ({ links, vertical = false }) => (
  <Box
    component="ul"
    sx={{
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      flexWrap: vertical ? 'nowrap' : 'wrap',
      rowGap: vertical ? 2 : 1.5,
      listStyle: 'none',
      p: 0,
      m: 0,
      minWidth: 0,
    }}
  >
    {links.map((link, index) => (
      <PublishedStoryMapFooterLink
        key={link.text}
        link={link}
        showBorder={!vertical && index < links.length - 1}
      />
    ))}
  </Box>
);

const PublishedStoryMapFooter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasToken = useSelector(state => state.account.hasToken);
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));
  const isMedium = useMediaQuery(theme.breakpoints.up('md'));

  const footerLinks = useMemo(() => getFooterLinks(t), [t]);
  const onSignIn = useCallback(() => {
    navigate('/account');
  }, [navigate]);

  const logo = (
    <RouterLink to="/" sx={{ display: 'inline-flex', flexShrink: 0 }}>
      <Box
        component="img"
        src="/storyMap/story-maps-footer-logo.svg"
        alt={t('common.terraso_logoText')}
        sx={{
          display: 'block',
          width: {
            xs: 190,
            md: 230,
          },
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </RouterLink>
  );

  const signInButton = hasToken ? null : (
    <Button
      variant="contained"
      color="secondary"
      size="small"
      onClick={onSignIn}
      sx={{
        whiteSpace: 'nowrap',
      }}
    >
      {t('user.sign_in')}
    </Button>
  );

  return (
    <Box
      component="footer"
      sx={{
        background: palette.secondary.main,
        color: palette.white,
        overflow: 'hidden',
      }}
    >
      <Typography sx={visuallyHidden} variant="h2">
        {t('footer.heading')}
      </Typography>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          px: {
            xs: 4,
            md: 3,
          },
          py: {
            xs: 3,
            md: 4,
          },
        }}
      >
        {isLarge ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {logo}
            <Box sx={{ flexShrink: 0 }}>
              <LocalePicker />
            </Box>
            <Box
              component="nav"
              aria-label={t('footer.navigation')}
              sx={{ flex: 1, minWidth: 0 }}
            >
              <PublishedStoryMapFooterLinks links={footerLinks} />
            </Box>
            {signInButton}
          </Box>
        ) : isMedium ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr)',
              columnGap: 4,
              rowGap: 2.5,
              alignItems: 'start',
            }}
          >
            <Box
              sx={{
                gridColumn: 1,
                gridRow: signInButton ? 1 : '1 / span 2',
              }}
            >
              {logo}
            </Box>
            <Box
              sx={{
                gridColumn: 2,
                gridRow: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                flexWrap: 'wrap',
                minWidth: 0,
              }}
            >
              <Box sx={{ flexShrink: 0 }}>
                <LocalePicker />
              </Box>
              <Box
                component="nav"
                aria-label={t('footer.navigation')}
                sx={{ minWidth: 0, flex: 1 }}
              >
                <PublishedStoryMapFooterLinks links={footerLinks} />
              </Box>
            </Box>
            {signInButton ? (
              <Box sx={{ gridColumn: 1, gridRow: 2 }}>{signInButton}</Box>
            ) : null}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr)',
              columnGap: 3,
              rowGap: 2.5,
              alignItems: 'start',
            }}
          >
            <Box sx={{ gridColumn: 1, gridRow: 1 }}>{logo}</Box>
            <Box sx={{ gridColumn: 2, gridRow: 1 }}>
              <LocalePicker />
            </Box>
            {signInButton ? (
              <Box sx={{ gridColumn: 1, gridRow: 2 }}>{signInButton}</Box>
            ) : null}
            <Box
              component="nav"
              aria-label={t('footer.navigation')}
              sx={{
                gridColumn: signInButton ? 2 : '1 / span 2',
                gridRow: 2,
                minWidth: 0,
              }}
            >
              <PublishedStoryMapFooterLinks links={footerLinks} vertical />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PublishedStoryMapFooter;

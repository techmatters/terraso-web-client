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

import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Link, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { visuallyHidden } from '@mui/utils';

import RouterLink from 'terraso-web-client/common/components/RouterLink';
import { getFooterLinks } from 'terraso-web-client/layout/footerUtils';

import theme from 'terraso-web-client/theme';

const { spacing, palette } = theme;

const year = new Date().getFullYear();

const FooterLink = ({ link, showBorder }) => {
  const borderStyle = {
    borderRight: `1px solid ${palette.gray.mid2}`,
    paddingRight: spacing(2),
    marginRight: spacing(2),
  };

  return (
    <Fragment>
      <Grid
        component="li"
        size={{ xs: 12, sm: 'auto' }}
        sx={{
          paddingBottom: {
            xs: spacing(1),
            sm: 0,
          },
        }}
      >
        <Link
          variant="body2"
          {...(link.to
            ? { component: RouterLink, to: link.to }
            : { href: link.url })}
          sx={{
            color: palette.white,
            ...(showBorder ? borderStyle : {}),
          }}
        >
          {link.text}
        </Link>
      </Grid>
    </Fragment>
  );
};

const LinksContainer = props => (
  <Grid
    container
    component="ul"
    spacing={0}
    sx={{
      listStyle: 'none',
      padding: 0,
      margin: 0,
    }}
    style={{
      maxWidth: '100%',
    }}
    justifyContent="flex-start"
    alignItems="center"
    {...props}
  />
);

const DefaultFooter = () => {
  const { t } = useTranslation();
  const isBig = useMediaQuery(theme.breakpoints.up('sm'));

  const footerLinks = getFooterLinks(t);

  return (
    <Grid
      container
      component="footer"
      className="footer"
      sx={{
        background: palette.secondary.main,
        color: palette.white,
      }}
      justifyContent="space-between"
    >
      <Typography sx={visuallyHidden} variant="h2">
        {t('footer.heading')}
      </Typography>
      <Grid
        sx={{
          width: '100%',
          margin: '0 auto',
          padding: 2,
          paddingLeft: 3,
          paddingRight: 3,
          maxWidth: 1200,
        }}
        aria-label={t('footer.heading')}
        component="nav"
      >
        <Grid component={LinksContainer} aria-label={t('footer.navigation')}>
          {footerLinks.map((link, index) => (
            <FooterLink
              key={index}
              link={link}
              showBorder={isBig && index < footerLinks.length - 1}
            />
          ))}
          <Grid
            component="li"
            sx={{
              flexGrow: 1,
            }}
          >
            &nbsp;
          </Grid>
          <Grid
            size={{ xs: 12, sm: 'auto' }}
            component="li"
            variant="body2"
            sx={{
              textAlign: 'right',
              paddingTop: {
                xs: spacing(1),
                sm: 0,
              },
            }}
          >
            <Typography variant="body2">© {year} Tech Matters</Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

const Footer = ({ FooterComponent = DefaultFooter }) => {
  return <FooterComponent />;
};

export default Footer;

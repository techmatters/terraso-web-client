import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Grid, Link, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import theme from 'theme';

const { spacing, palette } = theme;

const year = new Date().getFullYear();

const FooterLink = ({ link, showBorder }) => {
  const { t } = useTranslation();

  const borderStyle = {
    borderRight: `1px solid ${palette.white}`,
    paddingRight: spacing(2),
    marginRight: spacing(2),
  };

  return (
    <React.Fragment>
      <Grid
        item
        component="li"
        xs={12}
        sm="auto"
        sx={{
          paddingBottom: {
            xs: spacing(1),
            sm: 0,
          },
        }}
      >
        <Link
          variant="body2"
          underline="none"
          {...(link.to
            ? { component: RouterLink, to: t(link.to) }
            : { href: t(link.url) })}
          sx={{
            color: palette.white,
            ...(showBorder ? borderStyle : {}),
          }}
        >
          {t(link.text)}
        </Link>
      </Grid>
    </React.Fragment>
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
    justifyContent="flex-start"
    alignItems="center"
    {...props}
  />
);

const Footer = () => {
  const { t } = useTranslation();
  const isBig = useMediaQuery(theme.breakpoints.up('sm'));

  // Convert to Array. Remove items where URL is #. Return values from new array.
  // IN: {"help":{"text":"Terraso Help","url":"https://terraso.org/help/"}, "terms":{"text":"Terms of Use","url":"#"}}
  // OUT: [{"text":"Terraso Help", "url":"https://terraso.org/help/"}]
  const footerLinks = Object.entries(t('footer', { returnObjects: true }))
    .filter(item => item[1].url !== '#')
    .map(item => item[1]);

  return (
    <Grid
      container
      component="footer"
      justifyContent="space-between"
      sx={{
        width: '100%',
        background: palette.secondary.main,
        color: palette.white,
        padding: {
          xs: spacing(2),
          md: `${spacing(2)} ${spacing(10)} ${spacing(2)} ${spacing(10)}`,
        },
      }}
    >
      <Grid item xs={12} md={8} component={LinksContainer}>
        {footerLinks.map((link, index) => (
          <FooterLink
            key={index}
            link={link}
            showBorder={isBig && index < footerLinks.length - 1}
          />
        ))}
      </Grid>
      <Grid
        item
        xs={12}
        md="auto"
        component={Typography}
        variant="body2"
        sx={{
          textAlign: 'right',
          paddingTop: {
            xs: spacing(1),
            md: 0,
          },
        }}
      >
        © {year} Tech Matters
      </Grid>
    </Grid>
  );
};

export default Footer;

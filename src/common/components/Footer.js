import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link,
  Divider,
  Typography,
  Grid
} from '@mui/material'

import theme from 'theme'

const { spacing, palette } = theme

const year = new Date().getFullYear()

const footerLinks = [
  { url: '#', text: 'footer.help' },
  { url: 'https://terraso.org/contact-us/', text: 'footer.contact' },
  { url: '#', text: 'footer.terms' },
  { url: 'https://techmatters.org/privacy-policy/', text: 'footer.privacy' },
  { url: '#', text: 'footer.data' }
]

const FooterLink = ({ index, link }) => {
  const { t } = useTranslation()

  return (
    <React.Fragment>
      <Grid item component="li"
        xs={12} sm="auto"
        sx={{
          paddingBottom: {
            xs: spacing(1),
            sm: 0
          }
        }}
      >
        <Link
          variant="body2"
          underline="none"
          href={link.url}
          sx={{ color: palette.white }}
        >
          {t(link.text)}
        </Link>
      </Grid>
      {index < footerLinks.length - 1 && (
        <Divider
          flexItem
          orientation="vertical"
          sx={{
            bgcolor: 'white',
            marginLeft: spacing(2),
            marginRight: spacing(2)
          }}
        />
      )}
    </React.Fragment>
  )
}

const LinksContainer = props => (
  <Grid container
    component="ul"
    spacing={0}
    sx= {{
      listStyle: 'none',
      padding: 0,
      margin: 0
    }}
    justifyContent="flex-start"
    alignItems="center"
    {...props}
  />
)

const Footer = () => {
  return (
    <Grid container
      component="footer"
      justifyContent="space-between"
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        background: palette.secondary.main,
        color: palette.white,
        padding: {
          xs: spacing(2),
          md: `${spacing(2)} ${spacing(10)} ${spacing(2)} ${spacing(10)}`
        }
      }}
    >
      <Grid item xs={12} md={8}
        component={LinksContainer}
      >
        {footerLinks.map((link, index) => (
          <FooterLink key={index} index={index} link={link} />
        ))}
      </Grid>
      <Grid item xs={12} md="auto"
        component={Typography}
        variant="body2"
        sx={{
          textAlign: 'right',
          paddingTop: {
            xs: spacing(1),
            md: 0
          }
        }}
      >
        © {year} Tech Matters
      </Grid>
    </Grid>
  )
}

export default Footer

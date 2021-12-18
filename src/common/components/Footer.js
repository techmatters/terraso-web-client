import React from 'react'
// import useMediaQuery from '@mui/material/useMediaQuery'
import {
  Link,
  Divider,
  Typography,
  Container,
  Grid
} from '@mui/material'

import theme from 'theme'

const year = new Date().getFullYear()

const footerLinks = [
  { url: '#', text: 'Terraso Help' },
  { url: 'https://terraso.org/contact-us/', text: 'Contact' },
  { url: '#', text: 'Terms of Use' },
  { url: 'https://techmatters.org/privacy-policy/', text: 'Privacy Policy' },
  { url: '#', text: 'Data Policy' }
]

const FooterLink = ({ index, link }) => {
  return (
    <React.Fragment>
      <Grid item component="li"
        xs={12} sm="auto"
        sx={{
          paddingBottom: {
            xs: theme.spacing(1),
            sm: 0
          }
        }}
      >
        <Link
          variant="body2"
          underline="none"
          href={link.url}
          sx={{ color: theme.palette.white }}
        >
          {link.text}
        </Link>
      </Grid>
      {index < footerLinks.length - 1 && (
        <Divider
          flexItem
          orientation="vertical"
          sx={{
            bgcolor: 'white',
            marginLeft: theme.spacing(2),
            marginRight: theme.spacing(2)
          }}
        />
      )}
    </React.Fragment>
  )
}

const Footer = () => {
  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      width: '100%',
      background: theme.palette.secondary.main
    }}>
      <Container>
        <Grid container
          justifyContent="space-between"
          sx={{
            color: theme.palette.white,
            padding: theme.spacing(2)
          }}
        >
          <Grid item xs={12} md={8}>
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
            >
              {footerLinks.map((link, index) => (
                <FooterLink key={index} index={index} link={link} />
              ))}
            </Grid>
          </Grid>
          <Grid item
            xs={12}
            sm="auto"
          >
            <Typography
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: {
                  xs: theme.spacing(4),
                  md: 0
                }
              }}
            >
              © {year} Tech Matters
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </footer>
  )
}

export default Footer

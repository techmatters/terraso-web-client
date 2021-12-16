import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Link,
  Stack
} from '@mui/material';

import theme from 'theme';

const year = new Date().getFullYear();

const Footer = () => {
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const footerLinks = [
    { url: '#', text: 'Terraso Help' },
    { url: 'https://terraso.org/contact-us/', text: 'Contact' },
    { url: '#', text: 'Terms of Use' },
    { url: 'https://techmatters.org/privacy-policy/', text: 'Privacy Policy' },
    { url: '#', text: 'Data Policy' }
  ];

  return (
    <footer>
      <Stack direction={isSmall ? 'column' : 'row'} justifyContent="space-between" spacing={2} sx={{ color: theme.palette.white, background: theme.palette.secondary.main }}>
        <ul style={{ listStyle: 'none' }}>
          {
            footerLinks.map(link => <li style={{ display: isSmall ? 'block' : 'inline', padding: '0 5px' }}><Link sx={{ color: theme.palette.white }} href="{link.url}">{link.text}</Link></li>)
          }
        </ul>

        <ul style={{ listStyle: 'none', display: 'flex', alignItems: 'center', paddingRight: '40px' }}>
          <li>© {year} Tech Matters</li>
        </ul>
      </Stack>
    </footer>
  );
};

export default Footer;

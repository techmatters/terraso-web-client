import React from 'react';
import {
  Link,
  Stack
} from '@mui/material';

import theme from 'theme';

const year = new Date().getFullYear();

const Footer = () => (
  <footer>
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ color: theme.palette.white, background: theme.palette.secondary.main }}>
      <ul style={{ listStyle: 'none' }}>
        <li style={{ display: 'inline', padding: '0 5px' }}><Link sx={{ color: theme.palette.white }} href="#">Terraso Help</Link></li>
        <li style={{ display: 'inline', padding: '0 5px' }}><Link sx={{ color: theme.palette.white }} href="https://terraso.org/contact-us/">Contact</Link></li>
        <li style={{ display: 'inline', padding: '0 5px' }}><Link sx={{ color: theme.palette.white }} href="#">Terms of Use</Link></li>
        <li style={{ display: 'inline', padding: '0 5px' }}><Link sx={{ color: theme.palette.white }} href="https://techmatters.org/privacy-policy/">Privacy Policy</Link></li>
        <li style={{ display: 'inline', padding: '0 5px' }}><Link sx={{ color: theme.palette.white }} href="#">Data Policy</Link></li>
      </ul>

      <p style={{ display: 'flex', alignItems: 'center', paddingRight: '40px' }}>© {year} Tech Matters</p>
    </Stack>
  </footer>
);

export default Footer;

import React from 'react';

import { Link } from '@mui/material';

import { useAnalytics } from 'monitoring/analytics';

// Link for external resources. It handles opening it on a new
// tab and tracking the analytics event.
// This is neede because of this plausible issue:
// https://github.com/plausible/plausible-tracker/issues/12
const ExternalLink = ({ href, children }) => {
  const { trackEvent } = useAnalytics();
  const onClick = event => {
    window.open(href, '_blank', 'noopener,noreferrer');
    trackEvent('Outbound Link: Click', { props: { url: href } });
    event.preventDefault();
  };

  return (
    <Link href={href} onClick={onClick}>
      {children}
    </Link>
  );
};

export default ExternalLink;

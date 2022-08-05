import React from 'react';

import { Link } from '@mui/material';

import { useAnalytics } from 'monitoring/analytics';

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

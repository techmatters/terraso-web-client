import React from 'react';

import SocialShare from 'common/components/SocialShare';
import Breadcrumbs from 'navigation/Breadcrumbs';

import Container from './Container';

const BreadcrumbsShareContainer = () => {
  return (
    <Container
      id="breadcrumbs-share-container"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Breadcrumbs />
      <SocialShare />
    </Container>
  );
};

export default BreadcrumbsShareContainer;

import React, { useEffect, useRef } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Link } from '@mui/material';

import 'navigation/SkipLinks.css';

const HIDE_FOR_PATHS = ['/account'];

const SkipLinks = props => {
  const { contentRef, navigationRef } = props;
  const { t } = useTranslation();
  const location = useLocation();
  const initialRef = useRef(null);

  useEffect(() => {
    // Jump to initial ref after location change
    if (initialRef.current) {
      initialRef.current.focus();
    }
  }, [initialRef, location.pathname]);

  if (_.includes(location.pathname, HIDE_FOR_PATHS)) {
    return null;
  }

  const toContent = event => {
    contentRef.current.focus();
    event.stopPropagation();
    event.preventDefault();
  };

  const toNavigation = event => {
    navigationRef.current.focus();
    event.stopPropagation();
    event.preventDefault();
  };

  const links = [
    {
      label: t('navigation.skip_to_main_content'),
      href: '#main-heading',
      onClick: toContent,
    },
    {
      label: t('navigation.skip_to_main_navigation'),
      href: '#main-navigation-0',
      onClick: toNavigation,
    },
  ];

  return (
    <>
      {links.map((link, index) => (
        <Link
          key={index}
          component="a"
          underline="always"
          className="skip-link sr-only sr-only-focusable"
          onClick={link.onClick}
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
};

export default SkipLinks;

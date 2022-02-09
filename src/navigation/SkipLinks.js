import React, { useRef, useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

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

  return (
    <>
      <span tabIndex="-1" ref={initialRef} />
      <a
        className="skip-link sr-only sr-only-focusable"
        onClick={toContent}
        href="#content"
      >
        {t('navigation.skip_to_main_content')}
      </a>
      <a
        className="skip-link sr-only sr-only-focusable"
        onClick={toNavigation}
        href="#main-navigation"
      >
        {t('navigation.skip_to_main_navigation')}
      </a>
    </>
  );
};

export default SkipLinks;

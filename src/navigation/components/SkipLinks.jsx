/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import React, { useEffect, useRef } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Link } from '@mui/material';

import './SkipLinks.css';

const HIDE_FOR_PATHS = ['/account'];

const SkipLinks = () => {
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

  const links = [
    {
      label: t('navigation.skip_to_main_content'),
      href: '#main-heading',
    },
    {
      label: t('navigation.skip_to_main_navigation'),
      href: '#main-navigation-0',
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

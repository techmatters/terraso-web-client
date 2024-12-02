/*
 * Copyright © 2023 Technology Matters
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

import { useCallback, useMemo } from 'react';
import _ from 'lodash/fp';
import queryString from 'query-string';
import { useNavigate, useSearchParams } from 'react-router';

export const generateReferrerPath = location => {
  const path = _.getOr('', 'pathname', location);
  const queryParams = _.get('search', location);
  const referrer = [path.substring(1), queryParams]
    .filter(part => part)
    .join('');
  return referrer ? `/${referrer}` : null;
};

export const generateReferrerUrl = (to, location) => {
  const referrer = generateReferrerPath(location);

  return referrer
    ? queryString.stringifyUrl({
        url: to,
        query: {
          referrer,
        },
      })
    : to;
};

export const useReferrer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const referrer = searchParams.get('referrer');
  const referrerBase64 = searchParams.get('referrerBase64');

  const url = useMemo(() => {
    return referrerBase64 ? atob(referrerBase64) : referrer;
  }, [referrer, referrerBase64]);

  const goToReferrer = useCallback(
    (defaultUrl = '/') => {
      navigate(url ? decodeURIComponent(url) : defaultUrl, {
        replace: true,
      });
    },
    [navigate, url]
  );

  const appendReferrerBase64 = useCallback(
    url => {
      if (!referrer) {
        return url;
      }
      const parsedUrl = queryString.parseUrl(url);
      const redirectUrl = queryString.stringifyUrl({
        url: 'account',
        query: {
          referrerBase64: btoa(referrer),
        },
      });
      return queryString.stringifyUrl({
        ...parsedUrl,
        query: {
          ...parsedUrl.query,
          state: redirectUrl,
        },
      });
    },
    [referrer]
  );

  return { goToReferrer, appendReferrerBase64 };
};

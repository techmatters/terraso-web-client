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

import { useEffect, useRef, useState } from 'react';

export const useScript = url => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    document.body.appendChild(script);

    script.addEventListener('load', () => {
      setLoading(false);
    });

    return () => {
      document.body.removeChild(script);
    };
  }, [url]);
  return loading;
};

export const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

export const useCopy = (content, onCopy) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => () => setCopied(false), []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy?.();
  };

  return { copied, copyToClipboard };
};

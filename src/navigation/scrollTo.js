import { useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

export const scrollToNavBar = () => {
  document
    .getElementById('main-navigation')
    ?.scrollIntoView({ behavior: 'smooth' });
};

export const ScrollTo = () => {
  const [searchParams] = useSearchParams();
  const scrollTo = searchParams.get('scrollTo');

  useEffect(() => {
    if (!scrollTo) {
      return;
    }
    const element = document.getElementById(scrollTo);

    element?.scrollIntoView({ behavior: 'smooth' });
  }, [scrollTo]);

  return null;
};

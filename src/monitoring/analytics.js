import { useTranslation } from 'react-i18next';

import { PLAUSIBLE_DOMAIN, TERRASO_ENV } from 'config';
import Plausible from 'plausible-tracker';

export const plausible = Plausible({
  domain: PLAUSIBLE_DOMAIN,
  trackLocalhost: TERRASO_ENV === 'local',
});

plausible.enableAutoPageviews();
plausible.enableAutoOutboundTracking();

export const useAnalytics = () => {
  const { i18n } = useTranslation();

  const trackEvent = (name, options = {}) => {
    const extendedOptions = {
      ...options,
      props: {
        ...(options.props || {}),
        language: i18n.resolvedLanguage,
      },
    };
    plausible.trackEvent(name, extendedOptions);
  };

  return { trackEvent };
};

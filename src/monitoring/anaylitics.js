import Plausible from 'plausible-tracker';
import { useTranslation } from 'react-i18next';

import { PLAUSIBLE_DOMAIN } from 'config';

const plausible = Plausible({
  domain: PLAUSIBLE_DOMAIN,
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

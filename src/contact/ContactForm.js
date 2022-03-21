import React, { useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addMessage } from 'notifications/notificationsSlice';
import { useScript } from 'custom-hooks';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { HUBSPOT_FORMS } from 'config';

const ContactForm = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { data: user } = useSelector(state => state.account.currentUser);
  const [loadingForm, setLoadingForm] = useState(true);

  const loadingDependencies = useScript(
    'https://js.hsforms.net/forms/shell.js'
  );
  const loading = loadingDependencies || loadingForm;

  const iframeTitle = t('contact.iframe_title');

  useEffect(() => {
    if (loadingDependencies) {
      return;
    }

    setLoadingForm(true);
    const container = document.getElementById('contact-container');
    container.innerHTML = '';
    const form = window.hbspt.forms.create({
      region: HUBSPOT_FORMS.region,
      portalId: HUBSPOT_FORMS.portalId,
      formId: HUBSPOT_FORMS.contactForm[i18n.language],
      target: '#contact-container',
    });

    const onMessage = event => {
      if (_.get('data.type', event) !== 'hsFormCallback') {
        return;
      }
      // Available events: https://legacydocs.hubspot.com/global-form-events
      switch (_.get('data.eventName', event)) {
        case 'onFormReady': {
          // Set user email
          if (form.hasField('email')) {
            form.setFieldValue('email', user.email);
          }
          // Set iframe title
          const iframe = _.head(
            document.getElementsByClassName('hs-form-iframe')
          );
          if (iframe) {
            iframe.setAttribute('title', iframeTitle);
          }

          setLoadingForm(false);
          break;
        }
        case 'onFormSubmit':
          dispatch(
            addMessage({
              severity: 'success',
              content: 'contact.success',
            })
          );
          break;
        default:
      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [loadingDependencies, dispatch, user.email, i18n.language, iframeTitle]);

  return (
    <>
      {loading && <PageLoader />}
      <PageContainer id="contact-container" />
    </>
  );
};

export default ContactForm;

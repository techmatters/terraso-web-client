/* global hbspt */
import React, { useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addMessage } from 'notifications/notificationsSlice';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { HUBSPOT_FORMS } from 'config';

const ContactForm = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { data: user } = useSelector(state => state.account.currentUser);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  const [loadingForm, setLoadingForm] = useState(true);

  const loading = loadingDependencies || loadingForm;

  useEffect(() => {
    // Hubsopt dependencies
    const dependenciesScript = document.createElement('script');
    dependenciesScript.src = '//js.hsforms.net/forms/shell.js';
    dependenciesScript.async = true;
    document.body.appendChild(dependenciesScript);

    dependenciesScript.addEventListener('load', () => {
      setLoadingDependencies(false);
    });

    return () => {
      document.body.removeChild(dependenciesScript);
    };
  });

  useEffect(() => {
    // Form
    if (loadingDependencies) {
      return;
    }

    setLoadingForm(true);
    const container = document.getElementById('contact-container');
    container.innerHTML = '';
    const form = hbspt.forms.create({
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
        case 'onFormReady':
          if (form.hasField('email')) {
            form.setFieldValue('email', user.email);
          }
          setLoadingForm(false);
          break;
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
  }, [loadingDependencies, dispatch, user.email, i18n.language]);

  return (
    <>
      {loading && <PageLoader />}
      <PageContainer id="contact-container" />
    </>
  );
};

export default ContactForm;

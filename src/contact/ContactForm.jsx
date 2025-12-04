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

import React, { useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from 'terraso-client-shared/notifications/notificationsSlice';

import { useScript } from 'custom-hooks';

import { useDocumentTitle } from 'common/document';
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

  useDocumentTitle(t('contact.page_title'));

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

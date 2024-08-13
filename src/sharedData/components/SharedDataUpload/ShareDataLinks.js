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

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Button,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import { transformURL } from 'common/utils';
import Form from 'forms/components/Form';
import { FormContextProvider, useFormGetContext } from 'forms/formContext';
import { MAX_DESCRIPTION_CHARACTERS } from 'sharedData/sharedDataConstants';

import LinkIcon from '../LinkIcon';
import { useShareDataUploadContext } from './ShareDataUploadContext';
import SuccessContainer from './SuccessContainer';
import { groupDataEntryUploadsByStatus } from './utils';

export const VALIDATION_SCHEMA = yup
  .object({
    url: yup
      .string()
      .trim()
      .ensure()
      .transform(transformURL)
      .validTld()
      .url()
      .required(),
    name: yup.string().trim().required(),
    description: yup.string().max(MAX_DESCRIPTION_CHARACTERS).trim(),
  })
  .required();

const LinksContextFunctions = React.createContext();
const LinksContext = React.createContext();

const BASE_FIELD_PROPS = {
  inputProps: {
    size: 'small',
  },
  gridItemProps: {
    sx: {
      pb: 0,
    },
  },
};

const UrlWrapper = props => {
  const { linkId, children } = props;
  const { t } = useTranslation();
  const { onLinkDelete } = useContext(LinksContextFunctions);
  const links = useContext(LinksContext);

  const isLastLink = useMemo(() => links.length === 1, [links]);

  return (
    <Stack direction="row">
      {children}
      {!isLastLink && (
        <IconButton
          title={t('sharedData.delete_link_label')}
          onClick={() => onLinkDelete(linkId)}
        >
          <DeleteIcon sx={{ color: 'secondary.main' }} />
        </IconButton>
      )}
    </Stack>
  );
};

const isObjectValuesEmpty = _.flow(
  _.omit('id'),
  _.values,
  _.compact,
  _.isEmpty
);

const Link = props => {
  const { t } = useTranslation();
  const { trigger } = useFormGetContext();
  const { apiSuccesses, apiErrors, apiUploading, onLinkChange } = useContext(
    LinksContextFunctions
  );
  const { showSummary } = useShareDataUploadContext();
  const { linkId, link, index } = props;
  const [updatedValues, setUpdatedValues] = useState(link);
  const [baseFormData] = useState(link);

  const fields = useMemo(
    () => [
      {
        name: 'url',
        label: 'sharedData.upload_url_label',
        props: {
          ...BASE_FIELD_PROPS,
          InputWrapper: props => <UrlWrapper linkId={linkId} {...props} />,
        },
      },
      {
        name: 'name',
        label: 'sharedData.upload_name_label',
        props: BASE_FIELD_PROPS,
      },
      {
        name: 'description',
        label: 'sharedData.upload_description_label',
        placeholder: 'sharedData.upload_description_link_placeholder',
        props: BASE_FIELD_PROPS,
      },
    ],
    [linkId]
  );

  useEffect(() => {
    onLinkChange(linkId, updatedValues);
  }, [linkId, updatedValues, onLinkChange]);

  useEffect(() => {
    const isEmpty = isObjectValuesEmpty(baseFormData);
    if (!isEmpty && _.isEqual(baseFormData, link)) {
      trigger?.();
    }
  }, [baseFormData, link, trigger]);

  useEffect(() => {
    const isEmpty = isObjectValuesEmpty(updatedValues);
    if (!isEmpty && showSummary) {
      trigger?.();
    }
  }, [showSummary, trigger, updatedValues]);

  const apiLinkErrors = _.get(linkId, apiErrors);
  const apiSuccess = _.get(linkId, apiSuccesses);
  const isUploading = _.has(linkId, apiUploading);

  if (apiSuccess) {
    return (
      <SuccessContainer
        label={apiSuccess.name}
        message={t('sharedData.upload_link_success')}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <LinkIcon />
          <ExternalLink href={transformURL(apiSuccess.url)}>
            {apiSuccess.name}
          </ExternalLink>
        </Stack>
      </SuccessContainer>
    );
  }

  return (
    <>
      {isUploading && <LinearProgress />}
      <Stack
        component="section"
        aria-label={
          updatedValues.name ||
          t('sharedData.upload_link_no_name', { index: index + 1 })
        }
        spacing={1}
        sx={{
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 2,
          paddingBottom: 1,
        }}
      >
        {!_.isEmpty(apiLinkErrors) &&
          apiLinkErrors.map((apiError, index) => (
            <Alert
              key={index}
              sx={{
                width: '100%',
                boxSizing: 'border-box',
              }}
              severity="error"
            >
              {t(_.getOr(apiError, 'content', apiError), {
                ...apiError.params,
                updatedValues,
              })}
            </Alert>
          ))}
        <Form
          mode="onTouched"
          prefix={`link-${index}`}
          localizationPrefix="sharedData.upload_link_form"
          aria-label={updatedValues.name}
          fields={fields}
          values={baseFormData}
          validationSchema={VALIDATION_SCHEMA}
          onChange={setUpdatedValues}
        />
      </Stack>
    </>
  );
};

const SelectedLinks = () => {
  const { t } = useTranslation();
  const links = useContext(LinksContext);

  return (
    <Stack
      divider={
        <Divider
          flexItem
          sx={({ palette }) => ({
            border: `1px dashed ${palette.blue.dark}`,
          })}
        />
      }
      sx={({ palette }) => ({
        border: `2px dashed ${palette.blue.dark}`,
        minHeight: '200px',
        flexGrow: 1,
      })}
      justifyContent="center"
      alignItems="stretch"
    >
      {_.isEmpty(links) ? (
        <Typography align="center">
          {t('sharedData.upload_no_links')}
        </Typography>
      ) : (
        links.map((link, index) => (
          <FormContextProvider key={link.id}>
            <Link linkId={link.id} link={link} index={index} />
          </FormContextProvider>
        ))
      )}
    </Stack>
  );
};

const addLink = links => {
  const id = uuidv4();
  return {
    ...(links || {}),
    [id]: { id },
  };
};

const ShareDataLinks = props => {
  const { t } = useTranslation();
  const { linksState } = props;

  const { apiErrors, apiSuccesses, apiUploading, links, setLinks } = linksState;

  const onLinkChange = useCallback(
    (id, newLink) => {
      setLinks(links => ({
        ...links,
        [id]: newLink,
      }));
    },
    [setLinks]
  );
  const onLinkDelete = useCallback(
    id => {
      setLinks(_.omit(id));
    },
    [setLinks]
  );

  const onNewLink = () => setLinks(addLink);

  return (
    <>
      <Typography sx={{ fontWeight: 700, mb: 2 }}>
        {t('sharedData.upload_links_description')}
      </Typography>
      <LinksContextFunctions.Provider
        value={{
          onLinkChange,
          onLinkDelete,
          apiErrors,
          apiSuccesses,
          apiUploading,
        }}
      >
        <LinksContext.Provider value={Object.values(links)}>
          <SelectedLinks />
        </LinksContext.Provider>
      </LinksContextFunctions.Provider>
      <Button
        variant="outlined"
        onClick={onNewLink}
        sx={{ mt: 2 }}
        startIcon={<AddIcon />}
      >
        {t('sharedData.upload_links_add')}
      </Button>
    </>
  );
};

export const useLinksState = () => {
  const [linksPending, setLinksPending] = useState([]);
  const [linksUploading, setLinksUploading] = useState(false);
  const [linksSuccess, setLinksSuccess] = useState(0);

  const uploads = useSelector(_.get('sharedData.uploads.links'));

  const [links, setLinks] = useState({});
  const linkIds = useMemo(() => Object.keys(links), [links]);

  const { apiErrors, apiSuccesses, apiUploading } = useMemo(
    () => groupDataEntryUploadsByStatus(_.pick(linkIds, uploads)),
    [uploads, linkIds]
  );

  useEffect(() => {
    if (_.isEmpty(links)) {
      setLinks(addLink());
    }
  }, [links]);

  useEffect(() => {
    const pendingLinkIds = linkIds.filter(
      linkId => !_.has(linkId, apiSuccesses)
    );
    const pendingLinks = _.flow(
      _.pick(pendingLinkIds),
      _.values,
      _.filter(link => !isObjectValuesEmpty(link))
    )(links);
    setLinksPending(pendingLinks);
  }, [links, linkIds, apiSuccesses]);

  useEffect(() => {
    setLinksUploading(!_.isEmpty(apiUploading));
  }, [apiUploading, setLinksUploading]);

  useEffect(() => {
    const isCompleteSuccess =
      !_.isEmpty(Object.values(links)) &&
      !_.isEmpty(apiSuccesses) &&
      _.isEmpty(apiErrors) &&
      _.isEmpty(apiUploading);
    if (isCompleteSuccess) {
      setLinksSuccess(Object.keys(apiSuccesses).length);
    }
  }, [links, apiErrors, apiSuccesses, apiUploading, setLinksSuccess]);

  return {
    apiErrors,
    apiSuccesses,
    apiUploading,
    linksPending,
    linksUploading,
    linksSuccess,
    links,
    setLinks,
  };
};

export default ShareDataLinks;

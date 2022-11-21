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

import LinkIcon from '../LinkIcon';
import SuccessContainer from './SuccessContainer';
import { groupByStatus } from './utils';

export const VALIDATION_SCHEMA = yup
  .object({
    url: yup.string().trim().ensure().transform(transformURL).url().required(),
    name: yup.string().trim().required(),
    description: yup.string().maxCustom(200).trim(),
  })
  .required();

const LinksContextFunctions = React.createContext();

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
  const { onLinkDelete } = useContext(LinksContextFunctions);
  return (
    <Stack direction="row">
      {children}
      <IconButton aria-label="delete" onClick={() => onLinkDelete(linkId)}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
};

const Link = props => {
  const { t } = useTranslation();
  const { trigger } = useFormGetContext();
  const { apiSuccesses, apiErrors, apiUploading, onLinkChange } = useContext(
    LinksContextFunctions
  );
  const { linkId, link } = props;
  const [updatedValues, setUpdatedValues] = useState({ id: linkId });
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
        props: BASE_FIELD_PROPS,
      },
    ],
    [linkId]
  );

  useEffect(() => {
    onLinkChange(linkId, updatedValues);
  }, [linkId, updatedValues, onLinkChange]);

  useEffect(() => {
    if (Object.keys(baseFormData).length > 1 && _.isEqual(baseFormData, link)) {
      trigger?.();
    }
  }, [baseFormData, link, trigger]);

  const apiLinkErrors = _.get(linkId, apiErrors);
  const apiSuccess = _.get(linkId, apiSuccesses);
  const isUploading = _.has(linkId, apiUploading);

  if (apiSuccess) {
    return (
      <SuccessContainer message={t('sharedData.upload_link_success')}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ExternalLink href={transformURL(apiSuccess.url)}>
            {apiSuccess.name}
          </ExternalLink>
          <LinkIcon />
        </Stack>
      </SuccessContainer>
    );
  }

  return (
    <>
      {isUploading && <LinearProgress />}
      <Stack
        component="section"
        aria-label={updatedValues.name}
        spacing={1}
        sx={{
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 1,
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
          aria-labelledby="TODO"
          fields={fields}
          values={baseFormData}
          validationSchema={VALIDATION_SCHEMA}
          onChange={setUpdatedValues}
        />
      </Stack>
    </>
  );
};

const SelectedLinks = props => {
  const { t } = useTranslation();
  const { links } = props;

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
        links.map(link => (
          <FormContextProvider key={link.id}>
            <Link linkId={link.id} link={link} />
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
  const {
    linksState,
    setLinksState,
    setLinksPending,
    setLinksUploading,
    setLinksSuccess,
  } = props;

  const uploads = useSelector(_.get('sharedData.uploads.links'));

  const setState = useCallback(
    (field, newValue) =>
      setLinksState(state => ({
        ...state,
        [field]: newValue(state[field]),
      })),
    [setLinksState]
  );
  const links = useMemo(() => linksState.links || {}, [linksState.links]);
  const linkIds = useMemo(() => Object.keys(links), [links]);

  const { apiErrors, apiSuccesses, apiUploading } = useMemo(
    () => groupByStatus(_.pick(linkIds, uploads)),
    [uploads, linkIds]
  );

  useEffect(() => {
    const pendingLinkIds = linkIds.filter(
      linkId => !_.has(linkId, apiSuccesses)
    );
    const pendingLinks = Object.values(_.pick(pendingLinkIds, links));
    setLinksPending(pendingLinks);
  }, [links, linkIds, apiSuccesses, setLinksPending]);

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
      setLinksSuccess(true);
    }
  }, [links, apiErrors, apiSuccesses, apiUploading, setLinksSuccess]);

  const onLinkChange = useCallback(
    (id, newLink) => {
      setState('links', links => ({
        ...links,
        [id]: newLink,
      }));
    },
    [setState]
  );
  const onLinkDelete = useCallback(
    id => {
      setState('links', _.omit(id));
    },
    [setState]
  );

  const onNewLink = () => setState('links', addLink);

  return (
    <>
      <Typography sx={{ fontWeight: 700 }}>
        {t('sharedData.upload_description')}
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
        <SelectedLinks links={Object.values(links)} />
      </LinksContextFunctions.Provider>
      <Button variant="outlined" onClick={onNewLink} sx={{ mt: 2 }}>
        {t('sharedData.upload_links_add')}
      </Button>
    </>
  );
};

export default ShareDataLinks;

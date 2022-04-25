import React, { useEffect } from 'react';
import _ from 'lodash/fp';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';

import FormField from 'forms/components/FormField';

const getInitialEmptyValues = _.flow(
  _.map(field => [field.name, '']),
  _.fromPairs
);

const Form = props => {
  const { t } = useTranslation();
  const {
    prefix,
    fields,
    values,
    validationSchema,
    saveLabel,
    onSave,
    cancelLabel,
    onCancel,
    children,
    reverseActionsOrder,
  } = props;

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      ...getInitialEmptyValues(fields),
      ...values,
    },
    resolver: yupResolver(validationSchema),
  });

  const requiredFields = _.flow(
    _.toPairs,
    _.filter(([name, field]) =>
      _.getOr(false, 'exclusiveTests.required', field)
    ),
    _.map(([name]) => name)
  )(_.getOr({}, 'fields', validationSchema));

  useEffect(() => {
    if (values) {
      reset({
        ...getInitialEmptyValues(fields),
        ...values,
      });
    }
  }, [values, fields, reset]);

  const onSubmit = data => onSave(data);

  const ariaProps = _.pickBy(
    (value, propName) => propName.startsWith('aria-'),
    props
  );

  const actions = [
    <Button
      key="submit"
      type="submit"
      variant="contained"
      sx={{
        paddingLeft: 5,
        paddingRight: 5,
      }}
    >
      {t(saveLabel)}
    </Button>,
    onCancel && (
      <Button key="cancel" variant="text" onClick={onCancel}>
        {t(cancelLabel)}
      </Button>
    ),
  ];

  return (
    <Grid
      component="form"
      {...ariaProps}
      noValidate
      container
      spacing={2}
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: '100%' }}
    >
      {fields.map(field => (
        <Grid
          key={field.name}
          item
          xs={12}
          {..._.get('props.gridItemProps', field)}
        >
          <FormField
            control={control}
            required={_.includes(field.name, requiredFields)}
            id={`${prefix}-${field.name}`}
            name={field.name}
            label={field.label}
            info={field.info}
            inputProps={{
              type: field.type || 'text',
              placeholder: t(field.placeholder),
              ..._.getOr({}, 'props.inputProps', field),
            }}
            {..._.getOr({}, 'props', field)}
          />
        </Grid>
      ))}
      {children}
      <Grid
        item
        container
        xs={12}
        direction="row"
        justifyContent="space-between"
        sx={{ marginTop: 2 }}
      >
        {reverseActionsOrder ? actions.reverse() : actions}
      </Grid>
    </Grid>
  );
};

export default Form;

import React from 'react';

import RichTextEditor from 'common/components/RichTextEditor';

const EditableRichText = props => {
  const { label, value, onChange, placeholder } = props;

  return (
    <RichTextEditor
      addContainer
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default EditableRichText;

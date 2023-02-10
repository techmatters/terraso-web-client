import React from 'react';

import RichTextEditor from 'common/components/RichTextEditor';

const EditableRichText = props => {
  const { value, onChange, placeholder } = props;

  return (
    <RichTextEditor
      addContainer
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default EditableRichText;

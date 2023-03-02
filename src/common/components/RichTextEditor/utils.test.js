const { deserialize } = require('./utils');

test('RichTextEditorUtils: deserialize', () => {
  const html = `<meta charset='utf-8'>
    <h1>Heading 1</h1>
    <span>Lorem ipsum dolor sit amet, consectetur <strong>adipiscing</strong> elit.</span>
    <br>
    <h2>Heading 2</h2>
    <p>
      <span>Nunc non ultrices eros. Sed tincidunt feugiat massa in egestas</span>
      <a href="https://www.terraso.org/">consectetur</a>
      <span></span>
      <span> tempor turpis a arcu elementum, non <i>luctus</i> nibh suscipit.</span>
    </p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
    <ol>
      <li>Item 1</li>
      <li>Item 2</li>
    </ol>`;

  const parsed = new DOMParser().parseFromString(
    html.replace(/(\r\n|\n|\r)/gm, ''),
    'text/html'
  );
  const result = deserialize(parsed.body);

  expect(result).toEqual([
    {
      type: 'heading-one',
      children: [
        {
          text: 'Heading 1',
        },
      ],
    },
    {
      text: '    Lorem ipsum dolor sit amet, consectetur ',
    },
    {
      text: 'adipiscing',
      bold: true,
    },
    {
      text: ' elit.    \n    ',
    },
    {
      type: 'heading-two',
      children: [
        {
          text: 'Heading 2',
        },
      ],
    },
    {
      text: '    ',
    },
    {
      type: 'paragraph',
      children: [
        {
          text: '      Nunc non ultrices eros. Sed tincidunt feugiat massa in egestas      ',
        },
        {
          type: 'link',
          url: 'https://www.terraso.org/',
          children: [
            {
              text: 'consectetur',
            },
          ],
        },
        {
          text: '      ',
        },
        {
          text: '',
        },
        {
          text: '       tempor turpis a arcu elementum, non ',
        },
        {
          text: 'luctus',
          italic: true,
        },
        {
          text: ' nibh suscipit.    ',
        },
      ],
    },
    {
      text: '    ',
    },
    {
      type: 'bulleted-list',
      children: [
        {
          text: '      ',
        },
        {
          type: 'list-item',
          children: [
            {
              text: 'Item 1',
            },
          ],
        },
        {
          text: '      ',
        },
        {
          type: 'list-item',
          children: [
            {
              text: 'Item 2',
            },
          ],
        },
        {
          text: '    ',
        },
      ],
    },
    {
      text: '    ',
    },
    {
      type: 'numbered-list',
      children: [
        {
          text: '      ',
        },
        {
          type: 'list-item',
          children: [
            {
              text: 'Item 1',
            },
          ],
        },
        {
          text: '      ',
        },
        {
          type: 'list-item',
          children: [
            {
              text: 'Item 2',
            },
          ],
        },
        {
          text: '    ',
        },
      ],
    },
  ]);
});

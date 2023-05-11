import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/terrasoApi/schema.graphql',
  documents: ['src/**/*.ts', 'src/**/*.tsx'],
  generates: {
    'src/terrasoApi/gql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        skipTypename: true,
        enumsAsTypes: true,
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};
export default config;

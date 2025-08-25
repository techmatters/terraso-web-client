# Terraso Web Client

Terraso web client is a React application that powers the frontend of the Terraso platform.

## Contributing

## Requirements

- Docker: Version 28.3.2
- Node: Version 22.18.0
- NPM: Version 11.5.2

## Running locally

Set up your environment file. `local.env` is used for Docker and `.env.local` is used for `npm run start`.

```sh
$ cp local.env.sample .env.local
$ ln -s .env.local local.env
```

In the `.env.local` file

- set value for `REACT_APP_MAPBOX_ACCESS_TOKEN` based on what you have set up in https://account.mapbox.com/ > Access tokens.

## Available Scripts

In the project directory, you can run:

### `make build-docker`

Builds docker image for local environment

### `npm run start` or `make run`

Runs the app in the development mode.\
Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `make test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `make test-a11y`

Launches the test runner in the interactive watch mode also running the [jest-axe](https://www.npmjs.com/package/jest-axe) validation over the rendered components.

### `make test-coverage`

Lunches the test runner with coverage

### `make build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `make run-build`

Builds and runs the app

## Code Generation

We generate TypeScript types automatically from the backend schema that are required to build & run the client. Normally this will be done automatically by other scripts which depend on the types, but it can be done manually with `npm run generate-types`, or `npm run generate-types -- --watch` to automatically stay up to date. This can be useful for keeping IDE features working without needing to run `start` or `test`, or to help debug GraphQL problems.

## Environment

To define environment variables we are using: https://create-react-app.dev/docs/adding-custom-environment-variables/. The available variables are:

**REACT_APP_TERRASO_ENV**: Terraso Environment
**REACT_APP_TERRASO_API_URL**: Terraso API host URL
**REACT_APP_ROLLBAR_TOKEN**: Rollbar token
**REACT_APP_COOKIES_DOMAIN**: Cookie domain
**REACT_APP_HUBSPOT_FORMS_PORTAL_ID**: HubSpot portal ID
**REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_EN**: HubSpot English form ID
**REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_ES**: HubSpot Epanish form ID
**REACT_APP_PLAUSIBLE_DOMAIN**: Plausible domain configuration

To modify these variables inside the docker environment change the `local.env` file

### Run command with custom variable value directly with npm:

Start: `REACT_APP_TERRASO_API_URL=https://api.terraso.org/graphql npm start`

Build: `REACT_APP_TERRASO_API_URL=https://api.terraso.org/graphql npm run build`

## Localization

The localization is being handled by the `react-i18next`. You can check the documentation here: [https://react.i18next.com/](https://react.i18next.com/)

### Generate PO files

Executing `make localization-to-po` will generate the PO files in `locales/po/` from the JSON files in `src/localization/locales/`

### Generate JSON files

Executing `make localization-to-json` will generate the JSON files in `src/localization/locales/` from the PO files in `locales/po/`

## Contact Form

The contact section integrates with HubSpot to display it in the application. To gather the configuration needed for the Hubsport environment variables (`REACT_APP_HUBSPOT_FORMS_REGION`, `REACT_APP_HUBSPOT_FORMS_PORTAL_ID`, `REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_EN`, `REACT_APP_HUBSPOT_FORMS_CONTACT_FORM_ES`) get it for you form URL that should have this strcuture:

`https://app.hubspot.com/forms/{portal ID}/editor/{form ID}/edit/form`

## Analytics

The application is built to work with Plausible, to configure the domain Plausible will use you have to set the `REACT_APP_PLAUSIBLE_DOMAIN` environment variable.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Remove create-react-app wrapper `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

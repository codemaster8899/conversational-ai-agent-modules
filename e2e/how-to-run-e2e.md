# How to run the e2e tests locally
1. If this is your first run, you'll need to duplicate `.env.e2e.template` into a `.env.e2e` file
and set the variables as needed in your local setup. The admin user needs to exist, the user will be created by the tests.
2. Install playwright and load browsers with ` npx playwright install`.
3. Run the backend locally via Docker.
4. Then you have to run the project with the test environment variables (file `.env.e2e`),
with `vite --mode e2e` or `yarn run testenv`. 
5. For running the e2e tests, you can run `npx playwright test --ui --project "all"` or use the VS Code plugin to select which tests to run.
You can read more about it in the [playwright documentation](https://playwright.dev/docs/running-tests).
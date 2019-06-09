// @cliDescription  Generates a saga with an optional test.

module.exports = {
  description: "Generates a container and test, hooked up to redux.",
  run: async function(context) {
    // grab some features
    const { parameters, ignite, print, strings, filesystem } = context;
    const { pascalCase, isBlank, upperCase, lowerCase, upperFirst } = strings;
    const config = ignite.loadIgniteConfig();

    // validation
    if (isBlank(parameters.first)) {
      print.info(`${context.runtime.brand} generate saga <name>\n`);
      print.info("A name is required.");
      return;
    }

    const name = pascalCase(parameters.first);
    const upperName = upperCase(parameters.first);
    const initCapName = upperFirst(parameters.first);
    const lowerName = lowerCase(parameters.first);
    const props = { name, upperName, initCapName };

    const jobs = [
      { template: `saga.ejs`, target: `src/Sagas/${name}Sagas.js` }
    ];
    if (config.tests) {
      jobs.push({
        template: `saga-test.ejs`,
        target: `src/__tests__/Sagas/${name}SagaTest.js`
      });
    }

    // make the templates
    await ignite.copyBatch(context, jobs, props);

    // Patch in sagas's index.js
    const sagaName = name;
    const indexFilePath = `${process.cwd()}/src/Sagas/index.js`;
    const fixtureFilePath = `${process.cwd()}/src/Services/FixtureApi.js`;
    const apiFilePath = `${process.cwd()}/src/Services/Api.js`;
    const importToAdd = `import { get${sagaName} } from './${sagaName}Sagas'`;
    const crudToAdd = `  const get${initCapName} = data => api.get('${lowerName}s/' + data.id)`;
    const crudConsts = `    get${initCapName},`;

    if (!filesystem.exists(indexFilePath)) {
      const msg = `No '${indexFilePath}' file found.  Can't add to index.js.`;
      print.error(msg);
      process.exit(1);
    }

    // insert saga import
    ignite.patchInFile(indexFilePath, {
      after: "// Sagas",
      insert: importToAdd
    });

    ignite.patchInFile(indexFilePath, {
      after: "    // some sagas only receive an action",
      insert: `    takeLatest(${sagaName}Types.${upperName}_REQUEST, get${sagaName}, api),`
    });

    if (!filesystem.exists(fixtureFilePath)) {
      const msg = `No '${fixtureFilePath}' file found.  Can't add to index.js.`;
      print.error(msg);
      process.exit(1);
    }

    ignite.patchInFile(fixtureFilePath, {
      after: "// Functions return fixtures",
      insert: `  get${sagaName}: () => {
    return { ok: true, data: "21" }
  }, `
    });

    if (!filesystem.exists(apiFilePath)) {
      const msg = `No '${fixtureFilePath}' file found.  Can't add to Fixtures/API.js.`;
      print.error(msg);
      process.exit(1);
    }

    ignite.patchInFile(apiFilePath, {
      after: "// Define API Constants",
      insert: crudToAdd
    });

    ignite.patchInFile(apiFilePath, {
      after: "return {",
      insert: crudConsts
    });
  }
};

// @cliDescription  Generates a screen container, wired into the AppNavigation.

module.exports = {
  description: "Generates a container and test, hooked up to redux.",
  run: async function(context) {
    // grab some features
    const { parameters, strings, print, ignite, filesystem } = context;
    const { pascalCase, isBlank, lowerCase } = strings;
    // const config = ignite.loadIgniteConfig()

    // validation
    if (isBlank(parameters.first)) {
      print.info(`${context.runtime.brand} generate container <name>\n`);
      print.info("A name is required.");
      return;
    }

    const name = pascalCase(parameters.first);
    const props = { name };

    const jobs = [
      {
        template: "container.ejs",
        target: `src/Containers/${name}.js`
      },
      {
        template: "container-style.ejs",
        target: `src/Containers/Styles/${name}Style.js`
      },
      {
        template: "container-test.ejs",
        target: `src/__tests__/Containers/${name}Test.js`
      },
      {
        template: "container-messages.ejs",
        target: `src/Containers/Messages/${name}Messages.js`
      }
    ];

    await ignite.copyBatch(context, jobs, props);

    const containerName = name;
    const routeName =
      lowerCase(name).slice(-6) === "screen"
        ? lowerCase(name).substr(0, name.length - 6)
        : lowerCase(name);
    const indexFilePath = `${process.cwd()}/src/Containers/index.js`;
    const importToAdd = `import ${containerName} from './${containerName}'`;
    const exportToAdd = `  ${containerName},`;

    const navPath = `${process.cwd()}/src/Navigation/AppNavigation.js`;
    const routeToAdd = `          <Route exact path='/${routeName}' component={${containerName}} />`;

    if (!filesystem.exists(indexFilePath)) {
      const msg = `No '${indexFilePath}' file found.  Can't add to index.js.`;
      print.error(msg);
      process.exit(1);
    }

    // insert container import
    ignite.patchInFile(indexFilePath, {
      after: "// Container Index",
      insert: importToAdd
    });

    ignite.patchInFile(indexFilePath, {
      after: "export {",
      insert: exportToAdd
    });

    if (!filesystem.exists(navPath)) {
      const msg = `No '${navPath}' file found.  Can't add route to AppNavigation.js.`;
      print.error(msg);
      process.exit(1);
    }

    ignite.patchInFile(navPath, {
      after: "<div>",
      insert: routeToAdd
    });

    // import into the router file too
    ignite.patchInFile(navPath, {
      before: "RootScreen",
      insert: `  ${containerName},`
    });
  }
};

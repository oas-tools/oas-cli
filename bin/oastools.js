#!/usr/bin/env node 

import {initPrompt} from '../lib/initPrompt.js'
import { validateOASFile } from "@oas-tools/commons";
import { generateDevEnv } from '../lib/serverdevGenerator.js';
import { generateModule } from "../lib/moduleGenerator.js";
import { generateServer } from "../lib/serverGenerator.js";
import { generateFile } from '../lib/oasFileGenerator.js';
import { parseObject, parseArray } from '../utils/commons.js';
import {program} from "commander";

program
    .name('oas-tools')
    .description('Command Line Interface for OAS Tools')
    .usage('[command [options]]')
    .version('0.0.1')
    .showHelpAfterError(true)


/* Init command */
const init = program
    .command('init')
    .usage('[command [options]]')
    .description('Initialize a new service using OAS Tools ecosystem')
    .action(function() {
        if(process.argv.length > 2 && process.argv[2] !== 'init'){
            program.error(`unknown command '${process.argv[2]}'`);
        } else if(process.argv.length > 3 && !['server', 'module', 'dev-env', 'file'].includes(process.argv[3])) {
            this.error(`unknown command '${process.argv[3]}'`);
        } else {
            initPrompt().then((answers) => {
                switch (answers.command) {
                    case "Server":
                        if (answers.confirmation) generateServer(answers.oasFile, answers);
                        break;
                    case "Module":
                        if (answers.confirmation) generateModule(answers.moduleName, answers);
                        break;
                    case "Development environment":
                        if (answers.confirmation) generateDevEnv(answers);
                        break;
                    case "OpenAPI File":
                        if (answers.confirmation) {
                            const opts = {resourceName: [], idProperty: [], operations: {}};
                            Object.entries(answers).forEach(([key, val]) => {
                                if (key.includes('resourceName')) {
                                    opts.resourceName.push(val);
                                } else if (key.includes('idProperty')) {
                                    opts.idProperty.push(val);
                                } else if (key.includes('operations')) {
                                    const rNameKey = key.replace('operations', 'resourceName');
                                    opts.operations[answers[rNameKey]] = val;
                                } else {
                                    opts[key] = val;
                                }
                            });
                            generateFile(opts.resourceFile, opts)
                        }
                        break;
                }
            }).catch(err => {
                if (err.isTtyError) {
                    console.log("error: Environment not supported");
                } else {
                    console.log(`error: ${err.message}`);
                }
                process.exit(1);
            });
        }
    });

/* Init subcommands */
init
    .command('server <file>')
    .usage('<OpenApi v3 file in YAML or JSON>')
    .description('Generate code scaffolding to initialize a service running OAS Tools')
    .option('-n, --path-name <dirpath>', 'Path for the generated directory')
    .option('-r, --recursive', 'Generate directories recursively')
    .option('-p, --port <port>', 'Port to which the server will be listening')
    .option('-d, --dereference', 'Dereference the OpenApi document')
    .option('-m, --esm', 'Use ESM syntax instead of CommonJS')
    .option('-j, --json', 'Generate oas-doc file as JSON (default is YAML)')
    .option('-c, --container', 'Generate required files to build Docker image')
    .option('-z, --zip', 'Generate a zip and delete the folder')
    .action((file, options) => {
        try {
            generateServer(file, options);
        } catch (err) {
            console.log(`error: ${err.message}`);
            process.exit(1);
        }
    });

init
    .command('module <name>')
    .usage('<Module name>')
    .description('Generate code scaffolding to initialize a new module for OAS Tools')
    .option('--generate-server', 'Generate a test server for the new module')
    .option('-m, --esm', 'Use ESM syntax instead of CommonJS')
    .action((name, options) => {
        try {
            generateModule(name, options);
        } catch (err) {
            console.log(`error: ${err.message}`);
            process.exit(1);
        }
    });

init
    .command('dev-env')
    .usage('[options]')
    .description('Generate a workspace for OAS Tools development')
    .option('-g, --git-repo <url>', 'Git repository url')
    .option('-b, --git-branch <name>', 'Branch to clone the repo from')
    .option('--clone-commons', 'Clone commons library')
    .action((options) => {
        try {
            generateDevEnv(options);
        } catch (err) {
            console.log(`error: ${err.message}`);
            process.exit(1);
        }
    });

init
    .command('file <resource-file>')
    .usage('<Resource file> -n <names> -i <ids> -o <operations> [options]')
    .description('Generate the OpenApi document from a resource. \nExample: oas-tools init file example.json -n r1 r2 -i id1 id2 -o r1=GET,POST r2=PUT')
    .requiredOption('-n, --resource-name <names...>', 'List containing each resource name', parseArray)
    .requiredOption('-i, --id-property <ids...>', 'List containing each resource id property', parseArray)
    .requiredOption('-o, --operations <entries...>', 'Object containing available operations for each resource', parseObject)
    .option('-v, --version <version>', 'Open API version to be used')
    .option('-t, --title <title>', 'Title for the described API')
    .option('-d, --description <description>', 'Description for the described API')
    .option('-p, --path-name <path>', 'Path where the file will be located')
    .option('-j, --json', 'Output file in JSON format (default is YAML)')
    .action((resourceFile, options) => {
        try {
            generateFile(resourceFile, options);
        } catch (err) {
            console.log(`error: ${err.message}`);
            process.exit(1);
        }
    });

/* Validate command */
program
    .command('validate <file>')
    .usage('<OpenApi v3 file in YAML or JSON>')
    .description('Validate OpenAPI v3 file')
    .action((file) => {
        try {
            validateOASFile(file);
            console.log('success: File is valid')
        } catch (err) {
            console.log(`error: ${err.message}`);
        }
    });

program.parse();
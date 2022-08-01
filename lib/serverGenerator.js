import {validateOASFile} from "oas-devtools/utils";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateName } from '../utils/commons.js'
import $RefParser from "@apidevtools/json-schema-ref-parser";
import Handlebars from "handlebars";
import archiver from "archiver";
import jsyaml from "js-yaml";
import path from "path";
import fs, { mkdirSync } from "fs";


export async function generateServer(file, options) {
    if (process.version.replace('v','').split('.')[0] < 14) {
        console.error("error: OAS Tools v3 is not compatible with NodeJS versions below 14.X");
        process.exit(1);
    } else {
        try {
            validateOASFile(file);
            
            const cwd = process.cwd();
            const dirName = dirname(fileURLToPath(import.meta.url));
            const basePath = path.resolve(file).replace(/\\/g,'/').split('/').slice(0,-1).join('/');

            const parser = new $RefParser();
            const oasFile = await parser.dereference(file);
            const files = parser.$refs.paths().map(ref => ref.replace(/\\/g, '/').replace(basePath, ''));
            
            let projectDir = options.pathName ? options.pathName : 'generated-server';

            if (!/^[a-zA-Z0-9-_\/]+$/.test(projectDir)) {
                throw new Error("Invalid directory. Only alphanumeric characters and dashes are allowed");
            } else if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, {recursive: Boolean(options.recursive)})
            } else if (fs.readdirSync(projectDir).length !== 0) {
                throw new ReferenceError(`directory '${projectDir}' is not empty`);
            }

            // cd to projectDir
            process.chdir(projectDir);
            fs.mkdirSync('api');

            /* Write the oas-file inside /api */
            if (options.dereference) {
                if (options.json){
                    fs.writeFileSync('api/oas-doc.json', JSON.stringify(oasFile, null, 2).replace(/\.yaml/g, '.json'));
                    options.oasFilePath = 'api/oas-doc.json';
                } else {
                    fs.writeFileSync('api/oas-doc.yaml', jsyaml.dump(oasFile));
                    options.oasFilePath = 'api/oas-doc.yaml';
                }
            } else {
                await Promise.all(files.map(async (filepath) => {
                    mkdirSync(`api${filepath.split('/').slice(0,-1).join('/')}`, {recursive: true})
                    if (options.json) {
                        let content = await parser.parse(`${basePath}/${filepath}`);
                        content = JSON.stringify(content, null, 2).replace(/\.yaml/g, '.json');
                        fs.writeFileSync(`api/${filepath}`.replace('.yaml', '.json'), content);
                    } else {
                        fs.copyFileSync(`${basePath}/${filepath}`, `api/${filepath}`);
                    }
                }));
                options.oasFilePath = `api${files[0]}`.replace('.yaml', options.json ? '.json' : '.yaml');
            }

            options.packageName = oasFile.info.title.replace(/\s/g,'-').toLowerCase();

            /* write files based on templates */
            const templates = fs.readdirSync(`${dirName}/../templates/server`).filter((hbsTemplate) => {
                return !['server.js.hbs', 'Dockerfile.hbs', '.dockerignore.hbs'].includes(hbsTemplate) || options.container;
            });

            await Promise.all(templates.filter(t => t !== 'service.hbs').flatMap(async (hbsTemplate) => {
                if (hbsTemplate === 'controller.hbs') {
                    fs.mkdirSync('controllers');
                    fs.mkdirSync('services');
                    Object.entries(oasFile.paths).forEach(([path, obj]) => {
                        const controllerName = obj['x-router-controller'] ?? generateName(path, "controller");
                        
                        Object.entries(obj)
                        .filter(([op, _opObj]) => op !== 'x-router-controller')
                        .forEach(([_op, opObj]) => {
                            const opId = opObj.operationId ?? generateName(path, "function");
                            const opControllerName = opObj['x-router-controller'] ?? controllerName;
                            const controllerFilename = `controllers/${opControllerName}.js`;
                            const controllerFirstLoad = !fs.existsSync(controllerFilename);

                            const serviceName = opControllerName.replace(/Controller|controller/g, 'Service');
                            const serviceFilename = `services/${serviceName}.js`;
                            const serviceFirstLoad = !fs.existsSync(serviceFilename);

                            if (controllerFirstLoad || !new RegExp(`function ${opId}\\(`).test(fs.readFileSync(controllerFilename).toString())) {
                                const template = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/server/controller.hbs`).toString());
                                const controllerOp = template({ options, serviceName, opId, controllerFirstLoad});
                                fs.appendFileSync(controllerFilename, controllerOp);
                            }

                            if (serviceFirstLoad || !new RegExp(`function ${opId}`).test(fs.readFileSync(serviceFilename).toString())) {
                                const template = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/server/service.hbs`).toString());
                                const serviceOp = template({ options, opId});
                                fs.appendFileSync(serviceFilename, serviceOp);
                            }
                        });
                    });
                } else {
                    const template = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/server/${hbsTemplate}`).toString());
                    fs.writeFileSync(hbsTemplate.replace('.hbs',''), template({options, oasFile}));
                }
            }));

            /* zip the file and delete directory */
            if (options.zip) {
                projectDir.split('/').forEach(() => process.chdir('..'));
                const output = fs.createWriteStream(`./${options.packageName}.zip`);
                const archive = archiver('zip', {zlib: { level: 9 }});
                archive.pipe(output);
                archive.directory(projectDir, projectDir);
                archive.finalize();
                
                output.on('close', () => {
                    fs.rmSync(`${process.cwd()}/${projectDir.split('/')[0]}`, {recursive: true});
                });

                archive.on('error', (err) => {
                    throw err;
                });
            }

            /* Reset CWD */
            process.chdir(cwd);

        } catch(err) {
            console.log(`error: ${err.message}`);
            process.exit(1);
        }
    }
}
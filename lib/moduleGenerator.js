import { generateServer } from "./serverGenerator.js";
import Handlebars from "handlebars";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from "fs";


export function generateModule(name, options) {
    const moduleName = name.split(/[-_]/).map(s => s[0].toUpperCase() + s.slice(1)).join('');
    const dirName = dirname(fileURLToPath(import.meta.url));

    if (!(/^[a-z0-9\-_]+$/).test(name)) {
        throw Error("Invalid name for module");
    }

    fs.mkdirSync(name);

    const indexTmp = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/module/index.js.hbs`).toString());
    const packageJson = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/module/package.json.hbs`).toString());

    fs.writeFileSync(`${name}/index.js`, indexTmp({name, options, moduleName}));
    fs.writeFileSync(`${name}/package.json`, packageJson({name, options}));
    
    if (options.generateServer) {
        const cfg = {
            pathName: `${name}-server`,
            esm: options.esm,
            installModule: { moduleName: `${moduleName[0].toLowerCase()}${moduleName.slice(1)}`, importName: name }
        }
        const oasDoc = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/module/server-file.yaml.hbs`).toString());
        fs.writeFileSync(`${name}-oas-doc.yaml`, oasDoc({name, options, moduleName}));
        generateServer(`${name}-oas-doc.yaml`, cfg).then(() => {
            fs.rmSync(`${name}-oas-doc.yaml`);
        });
    }
}
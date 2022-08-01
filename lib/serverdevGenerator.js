import { generateServer } from "./serverGenerator.js";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Handlebars from "handlebars";
import fs from "fs";

export function generateDevEnv(options) {
    const dirName = dirname(fileURLToPath(import.meta.url));

    /* Clone core repository if option is set */
    if (options.gitRepo) {
        execCommand(`git clone ${options.gitBranch ? ('-b ' + options.gitBranch) : ''} ${options.gitRepo} oas-tools`);
    } else {
        execCommand(`git clone -b develop https://github.com/oas-tools/oas-tools.git oas-tools`);
    }
    execCommand('npm install', {cwd: 'oas-tools'});
    
    /* Clone oas-commons and symlink to core node_modules */
    if (options.cloneCommons) {
        fs.rmSync('oas-tools/node_modules/oas-devtools', {recursive: true});
        execCommand('git clone -b develop https://github.com/oas-tools/oas-devtools.git oas-tools/node_modules/oas-devtools');
        fs.symlinkSync('oas-tools/node_modules/oas-devtools', 'oas-devtools', 'junction');
        execCommand('npm install', {cwd: 'oas-devtools'});
    }
    

    /* Generate dev server for testing */
    const oasDoc = Handlebars.compile(fs.readFileSync(`${dirName}/../templates/module/server-file.yaml.hbs`).toString());
    fs.writeFileSync(`dev-oas-doc.yaml`, oasDoc({name: 'dev-server', moduleName: 'devServer'}));
    generateServer(`dev-oas-doc.yaml`, {pathName: 'dev-server', esm: true}).then(() => {
        fs.rmSync(`dev-oas-doc.yaml`);
        console.log('Development server has been generated!\n')
        execCommand('npm install ../oas-tools', {cwd: 'dev-server'});
    });
}

function execCommand(cmd, opts) {
    console.log('> ' + cmd);
    execSync(cmd, {...opts, stdio: [process.stdin, process.stdout, process.stderr]});
    console.log('\n>---------------------------------------------------------\n');
}
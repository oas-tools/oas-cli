import treePrompt from "inquirer-file-tree-selection-prompt";
import serverPrompt from "./prompts/serverPrompt.js";
import modulePrompt from "./prompts/modulePrompt.js";
import devenvPrompt from "./prompts/devenvPrompt.js"
import filePrompt from "./prompts/filePrompt.js";
import inquirer from "inquirer";
import Rx from "rxjs";

export function initPrompt() {
    const subject = new Rx.Subject();
    const promise = inquirer.prompt(subject);
   
    inquirer.registerPrompt('file-tree-selection', treePrompt);
    promise.ui.process.subscribe({next: (answer) => onEachAnswer(answer, subject)});

    /* Initial choice */
    subject.next({
        type: "list",
        name: "command",
        message: "Select a resource to initialize",
        choices: ["Server", "Module", "Development environment", "OpenAPI File"]
    });
    
    return promise;
}

function onEachAnswer(answer, subject) {
    const {name, answer: value} = answer;

    /* Server prompts */
    if (name === 'command' && value === 'Server') {
        serverPrompt.forEach((p) => subject.next(p));
    } 
    
    /* File prompts */
    if (name === 'command' && value === 'OpenAPI File') {
        filePrompt.slice(0, 4).forEach((p) => subject.next(p));
    } else if (name === 'resourceFile') {
        [...filePrompt[4](value), ...filePrompt.slice(5)].forEach((p) => subject.next(p));
    }

    /* Module prompts */
    if (name === 'command' && value === 'Module') {
        modulePrompt.forEach((p) => subject.next(p));
    }

    /* Dev Env prompt */
    if (name === 'command' && value === 'Development environment') {
        devenvPrompt.forEach((p) => subject.next(p));
    }

    /* End execution */
    if (name === 'confirmation') {
        subject.complete();
    }
}
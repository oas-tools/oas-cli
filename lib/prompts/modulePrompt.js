export default [
    {
        type: "input",
        name: "moduleName",
        message: "Insert name for the new module",
        default: 'generated-module',
        when: (answers) => answers.command === 'Module',
        validate: (input) => (/^[a-z0-9\-_]+$/).test(input)
    },
    {
        type: "list",
        name: "esm",
        message: "Choose the preferred Javascript convention for your module",
        choices: [{name: "ECMAScript Modules (ESM)", value: true}, {name: "CommonJS", value: false}],
        when: (answers) => answers.command === 'Module',
    },
    {
        type: "list",
        name: "generateServer",
        message: "Generate a test server with your module installed?",
        choices: [{name: "Yes", value: true}, {name: "No", value: false}],
        default: false,
        when: (answers) => answers.command === 'Module'
    },
    {
        type: "confirm",
        name: "confirmation",
        message: "Generate module with this options?",
        when: (answers) => answers.command === 'Module',
    }
]
export default [
    {
        type: "input",
        name: "pathName",
        message: "Where will be files generated?",
        when: (answers) => answers.command === 'Server',
        default: 'generated-server'
    },
    {
        type: "list",
        name: "recursive",
        message: "Generate directory tree recursively?",
        choices: [{name: "Yes", value: true}, {name: "No", value: false}],
        when: (answers) => answers.command === 'Server' && answers.pathName.includes('/'),
    },
    {
        type: "number",
        name: "port",
        message: "Port in which the server will be listening",
        default: 8080,
        when: (answers) => answers.command === 'Server'
    },
    {
        type: "file-tree-selection",
        name: "oasFile",
        message: "Specify the path to the OpenAPI Document",
        enableGoUpperDirectory: true,
        hideRoot: true,
        when: (answers) => answers.command === 'Server',
        validate: (input) => /[\w_]+\.yaml$|[\w_]+\.json$/.test(input),
    },
    {
        type: "list",
        name: "json",
        message: "Choose the preferred format for the OpenAPI Document",
        default: false,
        choices: [{name: "JSON", value: true}, {name: "YAML", value: false}],
        when: (answers) => answers.command === 'Server',
    },
    {
        type: "list",
        name: "dereference",
        message: "Dereference OpenAPI document?",
        default: false,
        choices: [{name: "Yes", value: true}, {name: "No", value: false}],
        when: (answers) => answers.command === 'Server',
    },
    {
        type: "list",
        name: "esm",
        message: "Choose the preferred Javascript convention for your server",
        choices: [{name: "ECMAScript Modules (ESM)", value: true}, {name: "CommonJS", value: false}],
        when: (answers) => answers.command === 'Server',
    },
    {
        type: "list",
        name: "container",
        message: "Will the server run inside a container?",
        choices: [{name: "Generate Dockerfile", value: true}, {name: "Run normally", value: false}],
        when: (answers) => answers.command === 'Server',
    },
    {
        type: "list",
        name: "zip",
        message: "Compress files in ZIP and delete?",
        default: false,
        choices: [{name: "Yes", value: true}, {name: "No", value: false}],
        when: (answers) => answers.command === 'Server',
    },
    {
        type: "confirm",
        name: "confirmation",
        message: "Generate server with this options?",
        when: (answers) => answers.command === 'Server',
    }
]
export default [
    {
        type: "input",
        name: "gitRepo",
        message: "Insert repository url. Skip to clone from OAS Tools main repository.",
        default: 'https://github.com/oas-tools/oas-tools.git',
        when: (answers) => answers.command === 'Development environment',
    },
    {
        type: "input",
        name: "gitBranch",
        message: "Insert repository branch.",
        default: 'develop',
        when: (answers) => answers.command === 'Development environment',
    },
    {
        type: "list",
        name: "cloneCommons",
        message: "Clone commons library?",
        choices: [{name: "Yes", value: true}, {name: "No", value: false}],
        default: false,
        when: (answers) => answers.command === 'Development environment'
    },
    {
        type: "confirm",
        name: "confirmation",
        message: "Generate module with this options?",
        when: (answers) => answers.command === 'Development environment',
    }
]
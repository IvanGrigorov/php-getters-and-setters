"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const phpTypes = ['string', 'int', 'dloat', 'null', 'bool', 'array', 'object', 'callable', 'resource'];
let getters = false;
let setters = false;
let constructor = false;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "php-getters-and-setters" is now active!');
    let createGettersAndSetters = vscode.commands.registerCommand('php-getters-and-setters.create', () => {
        const input = vscode.window.activeTextEditor?.selection;
        const selection = vscode.window.activeTextEditor?.document.getText(input) || '';
        generateGettersAndSetters(selection);
    });
    let createGetters = vscode.commands.registerCommand('php-getters-and-setters.createGetters', () => {
        const input = vscode.window.activeTextEditor?.selection;
        const selection = vscode.window.activeTextEditor?.document.getText(input) || '';
        generateGetters(selection);
    });
    let createSetters = vscode.commands.registerCommand('php-getters-and-setters.createSetters', () => {
        const input = vscode.window.activeTextEditor?.selection;
        const selection = vscode.window.activeTextEditor?.document.getText(input) || '';
        generateSetters(selection);
    });
    let createConstructor = vscode.commands.registerCommand('php-getters-and-setters.createConstructor', () => {
        const input = vscode.window.activeTextEditor?.selection;
        const selection = vscode.window.activeTextEditor?.document.getText(input) || '';
        createConstructorFromSelection(selection);
    });
    let createAll = vscode.commands.registerCommand('php-getters-and-setters.createAll', () => {
        const input = vscode.window.activeTextEditor?.selection;
        const selection = vscode.window.activeTextEditor?.document.getText(input) || '';
        createAllFromSelection(selection);
    });
    context.subscriptions.push(createGettersAndSetters);
    context.subscriptions.push(createGetters);
    context.subscriptions.push(createSetters);
    context.subscriptions.push(createConstructor);
    context.subscriptions.push(createSetters);
}
exports.activate = activate;
function splitLines(selection) {
    return selection.split(/\r\n|\r|\n/);
}
function generateGettersAndSetters(selection) {
    if (!selection)
        return;
    getters = true;
    setters = true;
    constructor = false;
    let properties = splitLines(selection);
    properties = properties.map((property) => property.trim());
    generate(properties);
}
function generateGetters(selection) {
    if (!selection)
        return;
    getters = true;
    setters = false;
    constructor = false;
    let properties = splitLines(selection);
    properties = properties.map((property) => property.trim());
    generate(properties);
}
function generateSetters(selection) {
    if (!selection)
        return;
    getters = false;
    setters = true;
    constructor = false;
    let properties = splitLines(selection);
    properties = properties.map((property) => property.trim());
    generate(properties);
}
function createConstructorFromSelection(selection) {
    if (!selection)
        return;
    getters = false;
    setters = false;
    constructor = true;
    let properties = splitLines(selection);
    properties = properties.map((property) => property.trim());
    generate(properties);
}
function createAllFromSelection(selection) {
    if (!selection)
        return;
    getters = true;
    setters = true;
    constructor = true;
    let properties = splitLines(selection);
    properties = properties.map((property) => property.trim());
    generate(properties);
}
function parsePropertyName(property) {
    const regexToparsePropertyName = new RegExp('\\$\\w+ *;', 'i');
    const propertyName = regexToparsePropertyName.exec(property);
    if (propertyName) {
        propertyName[0] = propertyName[0].replace('$', '');
        propertyName[0] = propertyName[0].replace(';', '');
        return propertyName[0];
    }
    return null;
}
function parseFullPropertyName(property) {
    const regexToparsePropertyName = new RegExp('\\$\\w+ *;', 'i');
    const propertyName = regexToparsePropertyName.exec(property);
    if (propertyName) {
        propertyName[0] = propertyName[0].replace(';', '');
        return propertyName[0];
    }
    return null;
}
function returnPropertyType(property) {
    let typeOfProperty = '';
    const propertyInfo = property.split(' ');
    if (propertyInfo.length == 3) {
        typeOfProperty = propertyInfo[1];
    }
    return typeOfProperty;
}
function generateConstructor(properties, editBuilder) {
    let paramTemplate = '';
    let propertyArray = [];
    properties.forEach(property => {
        const typeOfProperty = returnPropertyType(property);
        const name = parseFullPropertyName(property);
        if (typeOfProperty) {
            propertyArray.push(`${typeOfProperty} ${name}`);
        }
        else {
            propertyArray.push(`${name}`);
        }
    });
    paramTemplate = propertyArray.join(', ');
    let template = `
	public function __construct(${paramTemplate}) {
`;
    properties.forEach(property => {
        const name = parsePropertyName(property);
        const fullName = parseFullPropertyName(property);
        template +=
            `
		$this->${name} = ${fullName};`;
    });
    template +=
        `
	}
`;
    const doc = vscode.window.activeTextEditor.document;
    editBuilder.insert(new vscode.Position(doc.lineCount - 1, 1), template);
}
async function generateGetter(name, upperCaseName, type, editBuilder) {
    const doc = vscode.window.activeTextEditor.document;
    let templateWithType = `
	public function get${upperCaseName}() : ${type} {
		return $this->${name};
	}
`;
    let templateWithoutType = `
	public function get${upperCaseName}() {
		return $this->${name};
	}
`;
    if (type) {
        editBuilder.insert(new vscode.Position(doc.lineCount - 1, 1), templateWithType);
    }
    else {
        editBuilder.insert(new vscode.Position(doc.lineCount - 1, 1), templateWithoutType);
    }
}
async function generateSetter(name, upperCaseName, type, editBuilder) {
    let templateWithType = `
	public function set${upperCaseName}(${type} $value) {
		$this->${name} = $value;
	}
`;
    let templateWithoutType = `
	public function set${upperCaseName}($value) {
		$this->${name} = $value;
	}
`;
    const doc = vscode.window.activeTextEditor.document;
    if (type) {
        editBuilder.insert(new vscode.Position(doc.lineCount - 1, 1), templateWithType);
    }
    else {
        editBuilder.insert(new vscode.Position(doc.lineCount - 1, 1), templateWithoutType);
    }
}
async function generate(properties) {
    let text = vscode.window.activeTextEditor.document.getText().replace(/}$/, '').trim();
    vscode.window.activeTextEditor?.edit(editBuilder => {
        const doc = vscode.window.activeTextEditor.document;
        editBuilder.delete(new vscode.Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end));
        editBuilder.insert(doc.lineAt(0).range.start, text);
        editBuilder.insert(doc.lineAt(doc.lineCount - 1).range.end, '\r\n');
        if (constructor) {
            generateConstructor(properties, editBuilder);
        }
        properties.forEach(property => {
            let typeOfProperty = '';
            const propertyInfo = property.split(' ');
            if (propertyInfo.length == 3) {
                typeOfProperty = propertyInfo[1];
            }
            const name = parsePropertyName(property);
            const upperCaseName = name.charAt(0).toUpperCase() + name.slice(1);
            if (getters) {
                generateGetter(name, upperCaseName, typeOfProperty, editBuilder);
            }
            if (setters) {
                generateSetter(name, upperCaseName, typeOfProperty, editBuilder);
            }
        });
        editBuilder.insert(doc.lineAt(doc.lineCount - 1).range.end, '}');
    });
}
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
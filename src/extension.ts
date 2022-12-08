// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const phpTypes = ['string', 'int', 'dloat', 'null', 'bool', 'array', 'object', 'callable', 'resource'];
let getters = false;
let setters = false;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
	let createSetters = vscode.commands.registerCommand('php-getters-and-setters.create', () => {
		const input = vscode.window.activeTextEditor?.selection;
		const selection = vscode.window.activeTextEditor?.document.getText(input) || '';
		generateSetters(selection);
	});

	context.subscriptions.push(createGettersAndSetters);
	context.subscriptions.push(createGetters);
	context.subscriptions.push(createSetters);
}

function generateGettersAndSetters(selection: string) {
	if (!selection) return;
	getters = true;
	setters = true;
	let properties = selection.split('\r\n');
	properties = properties.map((property) => property.trim());
	generate(properties);
}

function generateGetters(selection: string) {
	if (!selection) return;
	getters = true;
	setters = false;
	let properties = selection.split('\r\n');
	properties = properties.map((property) => property.trim());
	generate(properties);
}

function generateSetters(selection: string) {
	if (!selection) return;
	getters = false;
	setters = true;
	let properties = selection.split('\r\n');
	properties = properties.map((property) => property.trim());
	generate(properties);
}

function parsePropertyName(property: string)  {
	const regexToparsePropertyName = new RegExp('\\$\\w+ *;', 'i');
	const propertyName = regexToparsePropertyName.exec(property);
	if (propertyName) {
		propertyName[0] = propertyName[0].replace('$', '');
		propertyName[0] = propertyName[0].replace(';', '');
		return propertyName[0];
	}
	return null;
}

async function generateGetter(name: string, upperCaseName: string, type: string, editBuilder: vscode.TextEditorEdit) {
	const doc = vscode.window.activeTextEditor!.document;
	let templateWithType = 
`
	public function get${upperCaseName}() : ${type} {
		return $this->${name};
	}
`;
	
	let templateWithoutType = 
`
	public function get${upperCaseName}() {
		return $this->${name};
	}
`;
	if (type) {
		editBuilder.insert(
			new vscode.Position(doc.lineCount-1, 1),
			templateWithType
		);
	}
	else {
		editBuilder.insert(
			new vscode.Position(doc.lineCount-1, 1),
			templateWithoutType
		);
	}
}

async function generateSetter(name: string, upperCaseName: string, type: string, editBuilder: vscode.TextEditorEdit) {

	let templateWithType = 
`
	public function set${upperCaseName}(${type} $value) {
		$this->${name} = $value;
	}
`;

	let templateWithoutType = 
`
	public function set${upperCaseName}($value) {
		$this->${name} = $value;
	}
`;

	const doc = vscode.window.activeTextEditor!.document;

	if (type) {
		editBuilder.insert(
			new vscode.Position(doc.lineCount-1, 1),
			templateWithType
		);
	}
	else {
		editBuilder.insert(
			new vscode.Position(doc.lineCount-1, 1),
			templateWithoutType
		);
	}

}

async function generate(properties: Array<string>) {
	let text = vscode.window.activeTextEditor!.document.getText().replace(/}$/, '').trim();
	vscode.window.activeTextEditor?.edit(editBuilder => {
		const doc = vscode.window.activeTextEditor!.document;
		editBuilder.delete(new vscode.Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end));
		editBuilder.insert(doc.lineAt(0).range.start, text);
		editBuilder.insert(doc.lineAt(doc.lineCount - 1).range.end, '\r\n');
		properties.forEach(property => {
			let typeOfProperty = '';
			const propertyInfo = property.split(' ');
			if (propertyInfo.length == 3) {
				typeOfProperty = propertyInfo[1];
			}
			const name = parsePropertyName(property);
			const upperCaseName = name!.charAt(0).toUpperCase() + name!.slice(1);
			if (getters) {
				generateGetter(name!, upperCaseName, typeOfProperty, editBuilder);
			}
			if (setters) {
				generateSetter(name!, upperCaseName, typeOfProperty, editBuilder);

			}
		})
		editBuilder.insert(doc.lineAt(doc.lineCount - 1).range.end, '}');
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}

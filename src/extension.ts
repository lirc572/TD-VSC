// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { declare, getTemperature } from './td';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "td" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('td.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '');
	});

	const setCredentials = async (): Promise<[string, string] | undefined> => {
		let username, password;
		username = await vscode.window.showInputBox({
			prompt: 'NUSNET username',
		});
		if (username === undefined) {
			return;
		}
		password = await vscode.window.showInputBox({
			password: true,
			prompt: 'NUSNET password',
		});
		if (password === undefined) {
			return;
		}
		context.globalState.update('credentials', [username, password]);
		return [username, password];
	};

	let setCredentialsCommand = vscode.commands.registerCommand('td.setCredentials', async () => {
		await setCredentials();
	});

	let declareCommand = vscode.commands.registerCommand('td.declare', async () => {
		let credentials: [string, string] | undefined = context.globalState.get('credentials');
		if (!credentials) {
			const credentialsAreSet = await setCredentials();
			if (credentialsAreSet) {
				credentials = credentialsAreSet;
			} else {
				return;
			}
		}
		// vscode.window.showInformationMessage(`Credentials: ${credentials}`);
		let tmpAm, tmpPm;
		for (; ;) {
			tmpAm = await vscode.window.showInputBox({
				prompt: 'AM temperature: (leave blank to randomize)',
			});
			if (tmpAm === undefined) {
				return;
			}
			if (!tmpAm) {
				tmpAm = getTemperature();
			}
			if (parseFloat(tmpAm) < 35) {
				await vscode.window.showWarningMessage('Temperature too low, please enter your temperature again!', 'OK');
			} else if (parseFloat(tmpAm) > 37) {
				const selected = await vscode.window.showWarningMessage('Temperature above 37, are you sure?', 'Yes', 'No, go back');
				if (selected === 'Yes') {
					break;
				}
			} else {
				break;
			}
		}
		for (; ;) {
			if (new Date().getHours() < 12) {
				tmpPm = '';
				break;
			}
			tmpPm = await vscode.window.showInputBox({
				prompt: 'PM temperature: (leave blank to randomize)',
			});
			if (tmpPm === undefined) {
				return;
			}
			if (!tmpPm) {
				tmpPm = getTemperature();
			}
			if (parseFloat(tmpPm) < 35) {
				await vscode.window.showWarningMessage('Temperature too low, please enter your temperature again!', 'OK');
			} else if (parseFloat(tmpPm) > 37) {
				const selected = await vscode.window.showWarningMessage('Temperature above 37, are you sure?', 'Yes', 'No, go back');
				if (selected === 'Yes') {
					break;
				}
			} else {
				break;
			}
		}
		// vscode.window.showInformationMessage(`Tmp: ${tmpAm}, ${tmpPm}`);
		const ssPath = await declare(credentials[0], credentials[1], tmpAm, tmpPm);
		if (typeof ssPath === 'string') {
			vscode.window.showInformationMessage(`Successful: {AM: ${tmpAm}, PM: ${tmpPm}}, result: ${ssPath}`);
		} else {
			vscode.window.showInformationMessage('Failed: ' + ssPath);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(setCredentialsCommand);
	context.subscriptions.push(declareCommand);
}

// this method is called when your extension is deactivated
export function deactivate() { }

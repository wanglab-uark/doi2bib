// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "doi2bib" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('doi2bib.doi2Bib', () => {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor; // get the active editor
        if (editor) {
            const document = editor.document; //
			var doi = document.lineAt(editor.selection.active.line).text; // the text at the current line should be the doi
			doi = doi.trim().replace(' ','');
			console.log('doi = '+doi);
			vscode.window.showInformationMessage('Getting bibtex for '+doi);
			// run python code to get the bibtex entry (string)
			const cmd = 'python get_bibtex_from_doi.py ' + doi + '> tmp_bibtex.txt';
			console.log('cmd = '+cmd);
            const cp = require('child_process');
			cp.execSync(cmd, {timeout:5000}); // wait for the command to finish
			// get the bibtex string from saved file
            var fs = require('fs');
            fs.readFile('tmp_bibtex.txt', 'utf-8', function (err: any, data: any) {
                if (err) throw err;
                editor.edit(editBuilder => {
					console.log('data = ');
					console.log(data);
					if (data.length > 5) {
						editBuilder.replace(new vscode.Range(editor.selection.active.line, 0, editor.selection.active.line+1, 0), data);
						if (data.indexOf('DOI Not Found')>=0) { // did not found the DOI, show error
							vscode.window.showErrorMessage('DOI Not Found: '+doi)
							console.log('Error: DOI Not Found');
						}
						else { // sucess
							vscode.window.showInformationMessage('Success for bibtex from '+doi);
							console.log('Success!');
						}
					}
					else { // get nothing
						vscode.window.showErrorMessage('No response from doi.org for '+doi);
						console.log('Error: data is too short, likely get nothing from doi.org.');
					}
                });
			});
			// make the selection empty
			console.log(editor.selections);
        };
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

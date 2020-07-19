// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

function modify_bibkey(bibtex:string) {
	if (bibtex.indexOf('DOI Not Found') >= 0) return bibtex;
	const chars_to_ignore = '!@#$%^&*()=+,./<>?~\[\]\\\{\}|;:"';
	const chars_to_space = '-_';
	const words_to_ignore = ['this ','that ','and ','or ','a ','an ','the ','of ',
                        'as ','on ','via ','by ','in ','at ',
						"'s ","' "];
	const lines = bibtex.split('\n');
	let ss = lines[0].split('{');
	let title = '';
	let bibkey = '';
    // get the orginal bibkey: which has the format of Author_Year
    bibkey = ss[ss.length-1].replace('_','').replace(',','')
	// get the title line
	lines.forEach(line => {
		if (line.trim().startsWith('title')) title = line.trim();
	});   
	ss = title.split('=');
	title = ss[ss.length-1].toLowerCase();
	console.log('orignal title = ' + title);
	var i;
	for(i=0; i<chars_to_ignore.length; i++) {
		title = title.split(chars_to_ignore.charAt(i)).join('').trim();
	}
	for(i=0; i<chars_to_space.length; i++) {
		title = title.split(chars_to_space.charAt(i)).join(' ').trim();
	}
	for(i=0; i<words_to_ignore.length; i++) {
		title = title.split(words_to_ignore[i]).join('').trim();
	}
	console.log('clean title = ' + title);
    // get the title words
	let words = title.split(' ');
	for(i=0; i<words.length; i++) {
		words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
	}
    // generate the new bibkey
	var n = 3;
	if(words.length<3) n = words.length;
	for(i=0; i<n; i++) {
		bibkey = bibkey + words[i];
	}
	// generate new bibkey
	let newbibtex = lines[0].split('{')[0]+'{'+bibkey+',\n';
	for(i=1; i<lines.length; i++) {
		newbibtex = newbibtex + lines[i] + '\n';
	}
	return newbibtex;
}

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
			// vscode.window.showInformationMessage('Getting bibtex for '+doi);
			const cmd = 'curl -L -H "Accept: application/x-bibtex" https://doi.org/' + doi;
			console.log('cmd = '+cmd);
            const cp = require('child_process');
			cp.exec(cmd, { timeout: 5000 }, (err: any, data: string, stderr: string) => {
                editor.edit(editBuilder => {
                    if (data.length > 5) {
						data = modify_bibkey(data);
                        editBuilder.replace(new vscode.Range(editor.selection.active.line, 0, editor.selection.active.line+1, 0), data);
                        if (data.indexOf('DOI Not Found')>=0) { // did not found the DOI, show error
                            vscode.window.showWarningMessage('DOI Not Found: '+doi)
                            console.log('Error: DOI Not Found');
                        }
                        else { // sucess
                            vscode.window.showInformationMessage('Success for bibtex from '+doi);
                            console.log('Success!');
                        }
                    };
                });
                if (err) {
                    vscode.window.showErrorMessage('Error in DOI2Bib ...');
                    console.log('error: ' + err);
                };
            }); // wait for the command to finish
        };
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

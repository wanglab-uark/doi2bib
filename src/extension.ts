// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below


// DOI2Bib: convert doi to bibtex entry
// 
// Author: Yong Wang (yongwang@uark.edu)
// Date:   07/19/2020
// Copyright (c) Yong Wang @ University of Arkansas
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY!


import * as vscode from 'vscode';

function modify_bibkey(bibtex:string) {
	if (bibtex.indexOf('DOI Not Found') >= 0) return bibtex;
	const chars_to_ignore = '!@#$%^&*()=+,./<>?~\[\]\\\{\}|;:"';
	const chars_to_space = '-_';
	const words_to_space = [' this ',' that ',' and ',' or ',' a ',' an ',' the ',' of ',
                        ' as ',' on ',' via ',' by ',' in ',' at ',
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
	for(i=0; i<words_to_space.length; i++) {
		title = title.split(words_to_space[i]).join(' ').trim();
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
            const document = editor.document; // get the current document
			var curline = document.lineAt(editor.selection.active.line).text; // the text at the current line
			curline = curline.trim().split(' ').join(''); // Remove spaces
			console.log('current line = ' + curline);
			vscode.window.showInformationMessage('DOI2BIB> getting bib for ' + curline);
			const lowercase = curline.toLowerCase();
			if (lowercase.startsWith('doi:') || lowercase.startsWith('pmid:') || lowercase.startsWith('pmcid:')) {
				// remove starting doi/pmid/pmcid if present
				let ss = curline.split(':');
				curline = ss[1].trim();
				console.log('cleaned curline = ' + curline);
			}
			const request = require('request');
			const url = 'https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids='+curline+'&format=json';
			console.log('url = '+url);
			request(url, // convert anything to doi using NCBI convertor
				(err_ncbi:any, resp_ncbi:string, data_ncbi:string)=>{
				if (err_ncbi) { // error
					vscode.window.showErrorMessage('Unable to connect to NCBI!');
					console.log('Error when connecting to NCBI: ' + err_ncbi);
					return err_ncbi; // do nothing and return
				}
				console.log('data_ncbi = ' + data_ncbi);
				if (JSON.parse(data_ncbi).status == 'error') {
					vscode.window.showWarningMessage('Invalid DOI or PMID or PMCID!');
					console.log('Error when getting doi from NCBI');
					return 'fail'; // do nothing and return
				}
				const doi = JSON.parse(data_ncbi).records[0].doi;
				console.log('doi = ' + doi);
				vscode.window.showInformationMessage('DOI2BIB> doi = ' + doi);
				if (doi.length>5) { // obtained DOI and it seems OK
					const options = {
						url: 'https://doi.org/'+doi,
						headers: {'Accept': 'application/x-bibtex'} 
					};
					request(options, // get bibtex entry from doi.org
						(err_doi:any, resp_doi:string, data_doi:string)=>{
						let data=data_doi;
						editor.edit(editBuilder => {
							if (data.length > 5) {
								data = modify_bibkey(data); // modify bibkey
								if (data.indexOf('DOI Not Found')>=0) { // did not found the DOI, show error
									vscode.window.showWarningMessage('DOI Not Found: '+doi)
									console.log('Error: DOI Not Found');
								}
								else { // sucess
									editBuilder.replace(
										new vscode.Range(editor.selection.active.line, 0, editor.selection.active.line+1, 0), 
										data);
									vscode.window.showInformationMessage('Success for bibtex from '+doi);
									console.log('Success!');
								}
							}
							else {
								vscode.window.showWarningMessage('No doi.org response for '+doi);
								console.log('Error: too short in the results. Likely something is wrong.');
							}
						});
						if (err_doi) {
							vscode.window.showErrorMessage('Error in DOI2Bib ...');
							console.log('error: ' + err_doi);
						};
					});
				}
			});
        };
	});
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

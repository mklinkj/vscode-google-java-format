import * as vscode from 'vscode';
import { execSync } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.languages.registerDocumentRangeFormattingEditProvider(
		{ scheme: 'file', language: 'java' }, {
		provideDocumentRangeFormattingEdits(
			document: vscode.TextDocument,
			range: vscode.Range,
			options: vscode.FormattingOptions,
			token: vscode.CancellationToken): Promise<vscode.TextEdit[]> {
			if (range.isEmpty) {
				return Promise.resolve([]);
			}

			return runFormatter(document.getText(range)).then(
				stdout => {
					return Promise.resolve([
						vscode.TextEdit.replace(range, stdout)
					]);
				},
				reason => {
					return Promise.reject(reason);
				}
			);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

function runFormatter(textRange: string): Promise<string> {
	const command = (() => {
		const executionType = `${vscode.workspace.getConfiguration('gjf').get('executionType')}`;
		if (executionType === 'jar') {
			const jarPath = `${vscode.workspace.getConfiguration('gjf').get('jarPath')}`;
			const javaHome = `${vscode.workspace.getConfiguration('gjf').get('javaHome')}`;
			const jvmOptions = `${(vscode.workspace.getConfiguration('gjf').get('jvmOptions') as string[]).join(' ')}`;
			return `${javaHome}/bin/java -jar ${jvmOptions} ${jarPath}`;
		} else {
			const nativeImagePath = `${vscode.workspace.getConfiguration('gjf').get('nativeImagePath')}`;
			return `${nativeImagePath}`;
		}
	})();

	return new Promise((resolve, reject) => {
		try {
			let stdout: string = execSync(
				`${command} -`,
				{
					encoding: "utf8",
					input: textRange,
					windowsHide: true
				});
			resolve(stdout);
		} catch (e) {
			reject(e);
		}
	});
}

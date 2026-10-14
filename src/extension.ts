import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand(
        'smart-loop-generation.generateLoop',
		async function main() {
			const x_str = await vscode.window.showInputBox({
				prompt: "Введите число x"
			});

			if (!x_str){
				vscode.window.showWarningMessage("Пожалуйста, введите корректное число x");
				return;
			}

			const y_str = await vscode.window.showInputBox({
				prompt: "Введите число y"
			});

			if (!y_str){
				vscode.window.showWarningMessage("Пожалуйста, введите корректное число y");
				return;
			}

			const x = ParseToInt(x_str);
			if (isNaN(x)) {
    			vscode.window.showErrorMessage(`"${x_str}" — это не число`);
    			return;
			}

			const y = ParseToInt(y_str);
			if (isNaN(y)) {
    			vscode.window.showErrorMessage(`"${y_str}" — это не число`);
    			return;
			}
			
			const branch = ChooseBranch(x, y);

			let result: number[];
			if (branch === true){
				result = WhileLoop(x, y);
			}else{
				result = ForLoop(x, y);
			}

			if (result.length === 0) {
    			vscode.window.showWarningMessage('Диапазон пуст, генерировать нечего');
    			return;
			}

			const code = GenerateCode(branch, x, y, result);
			
			await InsertCodeIntoEditor(code); 

		}
	);

	context.subscriptions.push(disposable);
}

function ParseToInt(x_str: string){
	const x = parseInt(x_str, 10);
	return x;
}

function ChooseBranch(x: number, y: number){
	if (y >= x){
		return true;
	}else{
		return false;
	}
}

function WhileLoop(x: number, y: number){
	const numbers: number[] = [];
	let i = x;
	while (y >= i){
		numbers.push(i * i);
		++i;
	}
	return numbers;
}

function ForLoop(x: number, y: number){

	const numbers: number[] = [];
	if (y > x){
		return numbers;
	}

	for (let i = y; i <= x; ++i){
		numbers.push(i * i);
	}
	
	return numbers;
}

function GenerateCode(branch: boolean, x: number, y: number, result: number[]){
	const templates = new Map<string, string>();
	templates.set(
		'while',
	`
let i = ${x};
while (i <= ${y}){
	console.log(i*i);
	++i;
}
// Сгенерировано чисел: ${result.length}

const arr${y} = [${result.join(', ')}];		
`
	);
	templates.set(
		'for',
		`
for (let i = ${y}; i <= ${x}; ++i){			
	console.log(i*i);
}
// Сгенерировано чисел: ${result.length}
		
const arr${y} = [${result.join(', ')}];
`
	);

	const key = branch ? 'while' : 'for';

	let code = templates.get(key);

	if (!code){
		return '';
	}

	return code;
}

async function InsertCodeIntoEditor(code: string){
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
    	vscode.window.showErrorMessage('Нет активного редактора для вставки кода');
    	return;
	}

	await editor.edit(editBuilder => {
    	editBuilder.insert(editor.selection.active, code);
	});
}

export function deactivate() {}
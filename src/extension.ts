import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	/*
	Основная функция плагина. В ней осуществляется последовательное выполнения 
	функций, представленных после главной функции
	*/
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
	/*
	Функция принимает значение x_str в формате string и преобразует его в число x

	Входные данные:
		x_str - вводимое строковое значени
	Выходные данные:
		x - десятичное число
	*/
	const x = parseInt(x_str, 10);
	return x;
}

function ChooseBranch(x: number, y: number){
	/*
	Функция принимает на вход два числа, сравнивает их и в зависимости от результата сравнения 
	возвращает true/false 
	Входные данные:
		x, y - десятичные числа
	Выходны данные: 
		true, если y >= x, и false, если y < x
	*/
	if (y >= x){
		return true;
	}else{
		return false;
	}
}

function WhileLoop(x: number, y: number){
	/*
	Функция добавляет в массив квадраты чисел в диапазоне от x до y
	Входные данные:
		x, y - десятичные числа
	Выходные данные:
		numbers - массив, все элементы которого являются квадратами чисел из диапазона от x до y

	*/
	const numbers: number[] = [];
	let i = x;
	while (y >= i){
		numbers.push(i * i);
		++i;
	}
	return numbers;
}

function ForLoop(x: number, y: number){
	/*
	Функция добавляет в массив кубы чисел в диапазоне от y до x
	Входные данные:
		x, y - десятичные числа
	Выходные данные:
		numbers - массив, все элементы которого являются кубами чисел из диапазона от y до x
	*/
	const numbers: number[] = [];
	if (y > x){
		return numbers;
	}

	for (let i = y; i <= x; ++i){
		numbers.push(i * i * i);
	}
	
	return numbers;
}

function GenerateCode(branch: boolean, x: number, y: number, result: number[]){
	/*
	Функция генерирует код, который позже будет выводиться в саму программу. Разный код генерируется
	с помощью функции Map<string, string> - с ее помощью программа понимает, какой именно фрагмент 
	кода нужно сгенерировать.
	Входные данные:
		x, y - десятичные числа
		branch - переменная, принимающая булевые значения true/false и отвечающая за выбор сгенерированного кода
		result - массив, который выводится из функций WhileLoop и ForLoop
	Выходные данные:
		code - сгенерированный код в виде строки

	*/
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
	console.log(i*i*i);
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
	/*
	Функция получает на вход строку, состоящую из кода, который нужно вывести.
	Проверяет, есть ли активный редактор кода. Если нет, выводит ошибку на экран, если есть, 
	запускает editor.edit() и вставляет готовый код после курсора

	Входные данные:
		code - строка, в которой хранится уже готовый код
	Выходные значения:
		в саму программу выводится готовый код, который генерируется по двум числовым значениям
	*/
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
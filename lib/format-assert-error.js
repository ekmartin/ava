'use strict';

var indentString = require('indent-string');
var chalk = require('chalk');
var diff = require('diff');

function cleanUp(line) {
	if (line[0] === '+') {
		return chalk.green('+ ') + line.slice(1);
	}

	if (line[0] === '-') {
		return chalk.red('- ') + line.slice(1);
	}

	if (line.match(/@@/)) {
		return null;
	}

	if (line.match(/\\ No newline/)) {
		return null;
	}

	return ' ' + line;
}

module.exports = function (err) {
	if (err.statements) {
		var statements = JSON.parse(err.statements);

		return statements
			.map(statement => statement[0] + '\n' + chalk.grey('=> ') + statement[1])
			.join('\n\n') + '\n';
	}

	if ((err.actualType === 'object' || err.actualType === 'array') && err.actualType === err.expectedType) {
		var patch = diff.createPatch('string', err.actual, err.expected);
		var msg = patch
			.split('\n')
			.splice(4)
			.map(cleanUp)
			.filter(Boolean)
			.join('\n');

		return 'Difference:\n\n' + msg;
	}

	if (err.actualType === 'string' && err.expectedType === 'string') {
		var patch = diff.diffChars(err.actual, err.expected);
		var msg = patch
			.map(part => {
				if (part.added) {
					return chalk.black.bgGreen(part.value);
				}

				if (part.removed) {
					return chalk.black.bgRed(part.value);
				}

				return part.value;
			})
			.join('');

		return 'Difference:\n\n' + msg + '\n';
	}

	return [
		'Actual:\n',
		indentString(err.actual, 2) + '\n',
		'Expected:\n',
		indentString(err.expected, 2) + '\n'
	].join('\n');
};

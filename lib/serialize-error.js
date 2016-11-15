'use strict';
var cleanYamlObject = require('clean-yaml-object');
var StackUtils = require('stack-utils');
var prettyFormat = require('pretty-format');
var reactElementPlugin = require('pretty-format/plugins/ReactElement');
var reactTestPlugin = require('pretty-format/plugins/ReactTestComponent');
var renderer = require('react-test-renderer');
var beautifyStack = require('./beautify-stack');

function isReactElement(obj) {
	return obj.type && obj.ref !== undefined && obj.props;
}

function filter(propertyName, isRoot, source, target) {
	if (!isRoot) {
		return true;
	}

	if (propertyName === 'stack') {
		target.stack = beautifyStack(source.stack);
		return false;
	}

	if (propertyName === 'statements') {
		target.statements = JSON.stringify(source[propertyName].map(statement => {
			var path = statement[0];
			var value = statement[1];

			if (isReactElement(value)) {
				value = renderer.create(value).toJSON();
			}

			var formattedValue = prettyFormat(value, {
				plugins: [reactTestPlugin, reactElementPlugin],
				highlight: true
			});

			return [path, formattedValue];
		}));

		return false;
	}

	if (propertyName === 'actual' || propertyName === 'expected') {
		var value = source[propertyName];
		target[propertyName + 'Type'] = typeof value;

		if (isReactElement(value)) {
			value = renderer.create(value).toJSON();
		}

		target[propertyName] = prettyFormat(value, {
			plugins: [reactTestPlugin, reactElementPlugin],
			highlight: true
		});

		return false;
	}

	return true;
}

var stackUtils = new StackUtils();

module.exports = function (error) {
	var err = cleanYamlObject(error, filter);

	var source = stackUtils.parseLine(err.stack.split('\n')[1]);
	err.source = {
		file: source.file,
		line: source.line
	};

	return err;
};

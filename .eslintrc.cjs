module.exports = {
	"env": {
		"commonjs": true,
		"es6": true,
		"node": true
	},
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"sourceType": "module",
		"tsconfigRootDir": __dirname,
		"project": ["./tsconfig.json"],
		"ecmaVersion": "2020"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"rules": {
		"indent": ["error", "tab", {
			"SwitchCase": 1
		}],
		"linebreak-style": [
			"warn",
			"unix"
		],
		"quotes": [
			"warn",
			"double"
		],
		"semi": [
			"warn",
			"always"
		],
		"no-unused-vars": [ "warn", {
			"args": "none"
		}],
		"no-console": "off",
		"no-empty": "warn",
		"no-undef": "off",
		"@typescript-eslint/no-var-requires": 0,
		"@typescript-eslint/no-unused-vars": [ "warn", {
			"args": "none"
		}],
	},
	"overrides": [
		{
			"files": ["**/test/**/*.js"],
			"env": {
				"mocha": true
			}
		}
	]
};
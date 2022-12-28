import path from "path";
import webpack from "webpack";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

export default function(env, argv){
	return {
		devtool: argv.mode === "development" ? "cheap-source-map" : undefined,
		entry: path.resolve("./src/index.ts"),
		output: {
			path: path.resolve("./dist"),
			filename: "worker.js",
			library: {
				type: "module",
			}
		},
		resolve: {
			// File resolve order
			extensions: ["", ".ts", ".js"]
		},
		experiments: {
			outputModule: true
		},
		optimization: {
			minimize: false
		},
		module: {
			rules: [
				{
					test: /(\.m?js|\.ts)$/,
					exclude: /node_modules/,
					use: {
						loader: "swc-loader",
						options: {
							jsc: {
								parser: {
									syntax: "typescript",
									dynamicImport: false
								},
								target: "es2020"
							},
							module: {
								type: "es6"
							}
						}
					}
				}
			]
		},
		plugins: [
			new ForkTsCheckerWebpackPlugin({
				typescript: {
					configFile: "./tsconfig.json"
				}
			}),
			new webpack.DefinePlugin({})
		]
	};
}
import chalk from 'chalk';
import config from './config';

const red = chalk.red;
const yellow = chalk.yellow;
const green = chalk.green;

const log = (message: string, ...extra: any) => console.log(config.logPrefix + message, ...extra);
const logIndent = (indent:number, message: string, ...extra: any) => console.log("  ".repeat(indent) + config.logPrefix + message, ...extra);

export { log, logIndent, red, yellow, green };

import './config';

import app from './app';
import { isAnyArrayBuffer, isNumberObject } from 'util/types';

app.loadDatafiles('./test-data/');

const port = process.env.EPPO_SDK_TEST_SERVER_PORT ?? '4000';
const portNum = !isNaN(+port) ? +port : 4000;

console.log(`Listening at localhost:${portNum}`);

app.server.listen(portNum);
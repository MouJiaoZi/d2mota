// 引入所有的lua模块
require('aeslua');
require('decrypt');
require('json');
require('md5');
require('popups');

// rename SHA and make it global
globalThis.SHA = require('sha');

import './tstl-utils';
import './util';

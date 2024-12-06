import 'sunlight-dota2-utils/dist/index';
import 'utils/_index';
import { ActivateModules } from './modules/_index';
import Precache from './utils/precache';
import './const';

Object.assign(getfenv(), {
    Activate: () => {
        ActivateModules();
    },
    Precache: Precache,
});

import './blocks/_index';

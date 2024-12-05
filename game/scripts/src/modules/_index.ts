import { CustomGridNav } from './CustomGrid';
import { EngineHook } from './EngineHook';
import { GameConfig } from './GameConfig';
import { GameDebug } from './GameDebug';
import { XNetTable } from './xnet-table';

declare global {
    interface CDOTAGameRules {
        // 声明所有的GameRules模块，这个主要是为了方便其他地方的引用（保证单例模式）
        Inited: boolean;
    }
}

/**
 * 这个方法会在game_mode实体生成之后调用，且仅调用一次
 * 因此在这里作为单例模式使用
 **/
export function ActivateModules() {
    if (!GameRules.Inited) {
        GameRules.Inited = true;

        // 初始化所有的GameRules模块
        // 如果某个模块不需要在其他地方使用，那么直接在这里使用即可
        new GameConfig();

        InitGameModules();
    }
}

function InitGameModules(): void {
    globalThis.Engine = new EngineHook();
    globalThis.XNetTable = new XNetTable();
    globalThis.Debug = new GameDebug();
    globalThis.CustomGrid = new CustomGridNav();
}

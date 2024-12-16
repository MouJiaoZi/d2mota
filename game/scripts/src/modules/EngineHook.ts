export class EngineHook {
    constructor() {
        // 这里是EngineHook的构造函数
        SLPrint('EngineHook Created');
        this._CreateDotaListener();
    }

    private _CreateDotaListener(): void {
        ListenToGameEvent(
            'game_rules_state_change',
            () => {
                this._OnGameRulesStateChange();
            },
            this
        );
    }

    private _OnGameRulesStateChange(): void {
        const state = GameRules.State_Get();
        if (state == GameState.GAME_IN_PROGRESS) {
            CustomGrid.CreatePlayerGrid();
        }
    }
}

declare global {
    var Engine: EngineHook;
}

@reloadable
export class GameDebug {
    constructor() {
        SLPrint('GameDebug Created');

        ListenToGameEvent(
            'player_chat',
            data => {
                this._ResolvePlayerChat(data);
            },
            this
        );

        CustomGameEventManager.RegisterListener('c2s_debug_command', (_, data) => {
            const new_data = [];
            for (const key of Object.keys(data.params)
                .map(v => tonumber(v))
                .sort((a, b) => a - b)) {
                new_data.push(data.params[tostring(key)]);
            }
            this._C2SDebugCommand(data.PlayerID, data.command, new_data);
        });

        ListenToGameEvent(
            'client_reload_game_keyvalues',
            () => {
                this._Init();
                Timers.CreateTimer(0.1, () => {
                    this._Init();
                });
            },
            this
        );
        this._Init();
    }

    private _debug_name: Record<string, string> = {};

    private _debug_function: Record<string, (unit: CDOTA_BaseNPC_Hero, player: CDOTAPlayerController, params: string[]) => void> = {};

    private _debug_description: Record<string, string> = {};

    private _debug_to_client: Record<string, boolean> = {};

    private _debug_param_count: Record<string, number> = {};

    private _C2SDebugCommand(player_id: PlayerID, command: string, params: string[]): void {
        const hero = PlayerResource.GetSelectedHeroEntity(player_id);
        const player = PlayerResource.GetPlayer(player_id);
        const cb = this._debug_function[command];
        if (cb) {
            SafelyCall(() => cb(hero, player, params));
        }
    }

    private _Init(): void {
        if (!GameRules.IsCheatMode()) {
            return;
        }
        this._debug_name = {};
        this._debug_function = {};
        this._debug_description = {};
        this._debug_to_client = {};
        this._debug_param_count = {};
        this.RegisterMyFunction();
    }

    private ___AfterReload(): void {
        this._Init();
        SLPrint('GameDebug AfterReload');
    }

    /**要注册的Debug指令写在这里，统一在这里写吧 */
    private RegisterMyFunction(): void {
        SLPrint('注册了Debug Command');
        this.Register('', '1', (unit, player, params) => {});
        this.Register('', '2', (unit, player, params) => {});
        this.Register('', '3', (unit, player, params) => {
            const t1 = Plat_FloatTime();
            const v1 = Vector(0, 0, 0);
            const v2 = Vector(1000, 1000, 0);
            for (let i = 0; i < 100000; i++) {
                GridNav.CanFindPath(v1, v2);
            }
            const t2 = Plat_FloatTime();
            for (let i = 0; i < 100000; i++) {
                GridNav.IsTraversable(v2);
            }
            const t3 = Plat_FloatTime();
            SLPrint('CanFindPath', t2 - t1);
            SLPrint('IsTraversable', t3 - t2);
        });
        this.Register('', '4', (unit, player, params) => {
            // unit.FindClearSpaceForUnit(Vector(-5025, -5258));
            const map_min_x = GetWorldMinX();
            const map_min_y = GetWorldMinY();
            const map_max_x = GetWorldMaxX();
            const map_max_y = GetWorldMaxY();
            SLPrint(map_min_x, map_min_y, map_max_x, map_max_y);
            //从左下到右上的64长度格子
            //横向有几个
            const num_h = math.ceil((map_max_x - map_min_x) / 64);
            const num_v = math.ceil((map_max_y - map_min_y) / 64);
            for (let i = 0; i < num_v; i++) {
                for (let j = 0; j < num_h; j++) {
                    //横坐标是j.5 * 64 纵坐标是i.5 * 64
                    const vx = (j + 0.5) * 64 + map_min_x;
                    const vy = (i + 0.5) * 64 + map_min_y;
                    const p = Vector(vx, vy);
                    // Timers.CreateTimer(0.1 * (i + j), () => {
                    DebugDrawCircle(
                        GetGroundPosition(p, null),
                        Vector(GridNav.IsTraversable(p) ? 0 : 255, GridNav.IsTraversable(p) ? 255 : 0, 0),
                        0,
                        32,
                        true,
                        10
                    );
                    // unit.SetAbsOrigin(Vector(vx, vy));
                    // CenterCameraOnUnit(player.GetPlayerID(), unit.GetEngineEntity());
                    // });
                }
            }
        });
    }

    /**
     * 注册一个Debug指令，不用带横杠，unit是发出聊天的人的英雄单位，player是聊天的人，params是指令的参数（以空格隔开的部分）
     * @param name 指令名称
     * @param command 聊天指令
     * @param func 功能函数
     * @param description 描述
     * @param no_pass_to_client 是否让前端的debug面板显示
     * @param param_count 参数数量，传给前端时要写
     */
    private Register(
        name: string,
        command: string,
        func: (unit: CDOTA_BaseNPC_Hero, player: CDOTAPlayerController, params: string[]) => void,
        pass_to_client: boolean = false,
        param_count: number = 0,
        description: string = '暂无描述'
    ): void {
        if (this._debug_function[command]) {
            SLError('重复注册了Debug Command', command);
            return;
        }
        this._debug_function[command] = func;
        this._debug_to_client[command] = pass_to_client;
        this._debug_param_count[command] = param_count;
        this._debug_name[command] = name;
        this._debug_description[command] = description;

        SLPrint('Registered Debug Command', command);
        if (GameRules.IsCheatMode()) {
            this._UpdateXNetTable();
        }
    }

    private _last_update_time = 0;

    private _UpdateXNetTable(): void {
        if (GameRules.GetGameTime() == this._last_update_time) {
            return;
        }
        this._last_update_time = GameRules.GetGameTime();
        const data: DebugCommandTransData[] = [];
        Timers.CreateTimer(FrameTime(), () => {
            for (const command of Object.keys(this._debug_function).sort()) {
                if (this._debug_to_client[command]) {
                    data.push({
                        command,
                        title: this._debug_name[command],
                        description: this._debug_description[command],
                        params_num: this._debug_param_count[command],
                    });
                }
            }
            XNetTable.SetTableValue('debug_command', 'commands', data);
        });
    }

    private _ResolvePlayerChat(data: PlayerChatEvent & GameEventProvidedProperties): void {
        if (!GameRules.IsCheatMode()) {
            return;
        }
        SLPrint('Player Chat:', data.text);
        const player_id = data.userid as PlayerID;
        const str = data.text;
        const player = PlayerResource.GetPlayer(player_id);
        if (!player) {
            return;
        }
        const hero = player.GetAssignedHero();
        const params = str.split(' ');
        const command = params[0];
        if (!command.startsWith('-')) {
            return;
        }
        const index = command.replace('-', '');
        const cb = this._debug_function[index];
        if (cb) {
            SafelyCall(() => cb(hero, player, params.slice(1)));
        }
    }

    /**手动调用前端 */
    public CallDebugFunction(command: string, who: CDOTAPlayerController, params: string[]): void {
        if (!who) {
            return;
        }
        const cb = this._debug_function[command];
        if (cb) {
            SafelyCall(() => cb(who.GetAssignedHero(), who, params));
        }
    }
}

declare global {
    var Debug: GameDebug;
}

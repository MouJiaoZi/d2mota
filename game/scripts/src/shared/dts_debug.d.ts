declare interface XNetTableDefinitions {
    /**测试指令 */
    debug_command: {
        /**command: 对应后端指令（唯一ID） title： 标题 description：描述 params_num：有几个参数 */
        commands: DebugCommandTransData[];
    };
}

declare interface CustomGameEventDeclarations {
    c2s_debug_command: {
        command: string;
        params: string[];
    };
}
declare interface DebugCommandTransData {
    command: string;
    title: string;
    description: string;
    params_num: number;
}

/**@noSelf */
declare const __TS__originalTraceback: (a?: any, b?: any, c?: any) => any;
declare const __TS__sourcemap: any;

if (__TS__originalTraceback != null) {
    //@ts-ignore
    debug.traceback = (thread, message, level) => {
        let trace;
        if (thread == null && message == null && level == null) {
            trace = __TS__originalTraceback();
        } else {
            trace = __TS__originalTraceback(thread, message, level);
        }
        if (typeof trace != 'string') {
            return 'Unknown Error Occured';
        }
        const [result, _] = string.gsub(trace, '(%S+).lua:(%d+)', (file, line) => {
            // //file去掉除字母、斜杠、反斜杠之外的字符
            // const [fileName, _] = string.gsub(file, "[^%a/\\]", "");
            //找到对应的ts文件
            const fileSourceMap = __TS__sourcemap[tostring(file) + '.lua'];
            if (fileSourceMap && fileSourceMap[line]) {
                return tostring(file) + '.ts:' + tostring(fileSourceMap[line]);
            }
            return tostring(file) + '.lua:' + tostring(line);
        });
        SaveError(result);
        return result;
    };
}

let err_info: string = null;

let ErrorStrArr: string[] = [];

function SaveError(msg: string) {
    msg = err_info || msg;
    err_info = null;
    PrintToChat(msg);
    //重复的错误不保存
    ErrorStrArr = ErrorStrArr || [];
    //最多暂存200个错误
    ErrorStrArr.length > 200 && ErrorStrArr.shift();
    const errorStr = json.encode(msg);
    if (!ErrorStrArr.includes(errorStr)) {
        ErrorStrArr.push(errorStr);
        // const publishStamp = PUBLISH_TIMESTAMP ?? "unknown_toolsmode";
        // if (publishStamp != "unknown_toolsmode") {
        //     Service.Request(-1, {
        //         url: "/api/game/v1/gameLog/save",
        //         body: {
        //             info: null,
        //             error: msg,
        //             version: "v1",
        //             roleId: "0",
        //             matchId: GameRules.MatchID,
        //         },
        //         noRetry: true,
        //         noPubCall: true,
        //         noStopAfterReload: true,
        //     });
        // }
    }
}

//NOTE 由于dota2控制台的单次print有最大字符数限制，所以这里做了分割处理 大概是2000字符
function SLPrint(this: void, ...str: any[]): void {
    if (!IsInToolsMode()) {
        return;
    }
    const prefix = '[SunLight]';
    const to_print = string.format(str.map(v => '%s').join(' '), ...str);
    const blocks = math.ceil(to_print.length / 2000);
    for (let i = 0; i < blocks; i++) {
        if (i == 0) {
            print(prefix, to_print.slice(i * 2000, (i + 1) * 2000));
        } else {
            print(to_print.slice(i * 2000, (i + 1) * 2000));
        }
    }
    // print(prefix, string.format(str.map((v) => "%s").join(" "), ...str));
}

function SLWarning(this: void, ...str: any[]): void {
    if (!IsInToolsMode()) {
        return;
    }
    const prefix = '[SunLight Warning]';
    const to_print = string.format(str.map(v => '%s').join(' '), ...str);
    const blocks = math.ceil(to_print.length / 2000);
    for (let i = 0; i < blocks; i++) {
        if (i == 0) {
            print(prefix, to_print.slice(i * 2000, (i + 1) * 2000));
        } else {
            print(to_print.slice(i * 2000, (i + 1) * 2000));
        }
    }
    err_info = `${prefix} ${str.join(' ')}`;
    debug.traceback();
}

function SLError(this: void, ...str: any[]): void {
    const prefix = '[SunLight Error]';
    err_info = `${prefix} ${str.join(' ')}`;
    const to_print = string.format(str.map(v => '%s').join(' '), ...str);
    const blocks = math.ceil(to_print.length / 2000);
    for (let i = 0; i < blocks; i++) {
        if (i == 0) {
            print(prefix, to_print.slice(i * 2000, (i + 1) * 2000));
        } else {
            print(to_print.slice(i * 2000, (i + 1) * 2000));
        }
    }
    debug.traceback();
    assert(false, 'debug.traceback()');
}

function PrintToChat(...str: any[]): void {
    if (!IsInToolsMode()) {
        return;
    }
    GameRules.SendCustomMessage(`[ToolsMode] ${str.join(' ')}`, -1, 0);
}

/**
 * 安全调用函数
 */
function SafelyCall<T extends (...params: any) => any>(func: () => ReturnType<T>): ReturnType<T> {
    const [success, result] = xpcall(
        () => func(),
        (err: any) => {
            SLError(`Error On CallFuncSafely : [${err ?? 'no msg'}]`);
            return null;
        }
    );
    return success ? result : null;
}

/**
 * 保留小数
 * @param num 数据源
 * @param decimalPlaces 保留位数
 * @returns
 */
function RoundToDecimal(num: number, decimalPlaces: number): number {
    const multiplier = Math.pow(10, decimalPlaces);
    return (Math.round(num * multiplier) || 0) / multiplier;
}

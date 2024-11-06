interface DollarStatic {
    log: (...args: any[]) => void;
    printFullStr: (str: string) => void;
}

$.log = (...args) => {
    if (!Game.IsInToolsMode()) {
        return;
    }
    const _args: any[] = [];
    args.forEach(value => {
        _args.push(value, ' ');
    });
    $.Msg(..._args);
};

$.printFullStr = (str: string) => {
    const lineLen = 200;
    const lineCount = Math.ceil(str.length / lineLen);
    for (let i = 0; i < lineCount; i++) {
        $.log(str.substring(i * lineLen, (i + 1) * lineLen));
    }
    $.log('');
};

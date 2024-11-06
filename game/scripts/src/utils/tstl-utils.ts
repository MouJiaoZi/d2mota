const global = globalThis as typeof globalThis & {
    reloadCache: Record<string, any>;
};
if (global.reloadCache === undefined) {
    global.reloadCache = {};
}

function reloadable<T extends { new (...args: any[]): {} }>(constructor: T): T {
    if (!IsInToolsMode()) {
        return constructor;
    }

    const className = constructor.name;
    if (global.reloadCache[className] === undefined) {
        global.reloadCache[className] = constructor;
    }

    Object.assign(global.reloadCache[className].prototype, constructor.prototype);
    return global.reloadCache[className];
}

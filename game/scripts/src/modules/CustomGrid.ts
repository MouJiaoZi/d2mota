export class CustomGridNav {
    constructor() {
        SLPrint('CustomGridNav constructor');
    }

    /**每个格子有多大 */
    public readonly gridSize = 256;

    /**格子在横向、纵向的数量 */
    public readonly gridXYNum = 11;
}

declare global {
    var CustomGrid: CustomGridNav;
}

abstract class CBaseMTBlock {
    /**棋盘索引 */
    private m_iBoardIndex: number = 0;
    /**格子横向索引 */
    private m_iGridX: number = 0;
    /**格子纵向索引 */
    private m_iGridY: number = 0;
    /**该方块是否可通行 */
    private m_bTreavalable: boolean = false;
    /**该方块的Z轴优先级 */
    public readonly m_iZIndex: number = 0;
    /**该方块的实体 */
    protected m_pEntity: CBaseEntity = null;

    /**
     *创建基础方块
     * @param iBoardIndex 棋盘索引
     * @param iGridX 格子横向索引
     * @param iGridY 格子纵向索引
     * @param iZIndex 该方块的Z轴优先级
     */
    constructor(iBoardIndex: number, iGridX: number, iGridY: number, iZIndex: number) {
        this.m_iBoardIndex = iBoardIndex;
        this.m_iGridX = iGridX;
        this.m_iGridY = iGridY;
        this.m_iZIndex = iZIndex;
        //检查各项参数是否合法
        //检查棋盘索引是否合法
        const board = CustomGrid.m_GridInstances[this.m_iBoardIndex];
        if (!board) {
            SLError('CBaseMTBlock: 棋盘索引错误');
        }
        //检查格子索引是否合法
        const _grid_data = board.m_pGridData[this.m_iGridX] ?? [];
        const grid_data = _grid_data[this.m_iGridY];
        if (!grid_data) {
            SLError('CBaseMTBlock: 格子索引错误');
        }
        //生成实体
        this.EntitySpawnFunction();
        //将实体放在对应位置
        if (!this.m_pEntity) {
            SLError('CBaseMTBlock: 实体生成错误，找不到实体');
        }
        //
        const target_pos = grid_data.center;
        //根据Z轴优先级设置高度
        target_pos.z = iZIndex * 10;
        this.m_pEntity.SetAbsOrigin(target_pos);
    }

    /**
     * 实体生成函数
     */
    protected abstract EntitySpawnFunction(): void;

    /**
     * 获取该方块所在棋盘id
     * @returns 该方块所在棋盘id
     */
    public GetBoardIndex(): number {
        return this.m_iBoardIndex;
    }

    /**
     * 获取该方块所在地块XY
     * @returns 该方块所在地块XY
     */
    public GetGridIndex(): [number, number] {
        return [this.m_iGridX, this.m_iGridY];
    }

    /**
     * 直接设置该方块到某个地块索引
     * @param iGridIndex 地块索引
     */
    public SetToGridIndex(iGridX: number, iGridY: number): void {
        //TODO 检查是否越界、是否合法
    }

    /**
     * 该方块是否可通行
     * @returns 是否可通行
     */
    public IsTreavalable(): boolean {
        return this.m_bTreavalable;
    }

    /**
     * 设置该方块是否可通行
     * @param bTreavalable 是否可通行
     */
    public SetTreavalable(bTreavalable: boolean): void {
        this.m_bTreavalable = bTreavalable;
    }
}

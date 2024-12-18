abstract class CBaseMTBlock {
    /**棋盘索引 */
    private _m_iBoardIndex: number = 0;
    public get m_iBoardIndex(): number {
        return this._m_iBoardIndex;
    }

    private set m_iBoardIndex(value: number) {
        this._m_iBoardIndex = value;
    }

    /**格子横向索引 */
    private _m_iGridX: number = 0;
    public get m_iGridX(): number {
        return this._m_iGridX;
    }

    private set m_iGridX(value: number) {
        this.SetToGridIndex(value, this.m_iGridY);
    }

    /**格子纵向索引 */
    private _m_iGridY: number = 0;
    public get m_iGridY(): number {
        return this._m_iGridY;
    }

    private set m_iGridY(value: number) {
        this.SetToGridIndex(this.m_iGridX, value);
    }

    /**该方块是否可通行 */
    protected _m_bTreavalable: boolean = false;
    public get m_bTreavalable(): boolean {
        return this._m_bTreavalable;
    }

    public set m_bTreavalable(value: boolean) {
        this._m_bTreavalable = value;
    }

    /**该方块的实体 */
    protected m_pEntity: CBaseEntity = null;
    /**该方块所在楼层 */
    public readonly m_iFloorID: TowerFloorID = -1 as TowerFloorID;

    /**
     *创建基础方块
     * @param iBoardIndex 棋盘索引
     * @param iGridX 格子横向索引
     * @param iGridY 格子纵向索引
     * @param iZIndex 该方块的Z轴优先级
     */
    constructor(iBoardIndex: number, iGridX: number, iGridY: number, iFloorID: TowerFloorID) {
        this.m_iBoardIndex = iBoardIndex;
        this.m_iFloorID = iFloorID;
        //生成实体
        this.EntitySpawnFunction();
        //实体是否存在
        if (!this.m_pEntity) {
            SLError('CBaseMTBlock: 实体生成错误，找不到实体');
        }
        //将实体放在对应位置
        this.SetToGridIndex(iGridX, iGridY);
    }

    /**该方块的Z轴优先级 不可小于0 */
    private _m_iZIndex: number = 0;
    public get m_iZIndex(): number {
        return this._m_iZIndex;
    }

    public set m_iZIndex(value: number) {
        this._m_iZIndex = value;
        //根据Z轴优先级设置高度
        if (this._m_iZIndex < 0) {
            SLWarning(this.constructor.name, '的Z轴优先级小于0，将被修正为0');
        }
        if (math.floor(this._m_iZIndex) != this._m_iZIndex) {
            SLWarning(this.constructor.name, '的Z轴优先级不是整数，将被四舍五入');
        }
        this._m_iZIndex = math.floor(math.max(0, this._m_iZIndex) + 0.5);
        if (this.m_iZIndex == 0 && this.constructor.name != 'CMTBlock_Floor') {
            SLWarning(this.constructor.name, '的Z轴优先级为0，与地板相同了');
        }
        const target_pos = this.m_pEntity.GetAbsOrigin();
        target_pos.z = this.m_iZIndex;
        this.m_pEntity.SetAbsOrigin(target_pos);
    }

    /**
     * 实体生成函数，记得在这里设置zIndex
     */
    protected abstract EntitySpawnFunction(): void;

    /**
     * 直接设置该方块到某个地块索引
     * @param iGridIndex 地块索引
     */
    public SetToGridIndex(iGridX: number, iGridY: number): void {
        //检查棋盘索引是否合法
        const board = CustomGrid.m_GridInstances[this.m_iBoardIndex];
        if (!board) {
            SLError('CBaseMTBlock: 棋盘索引错误');
        }
        //检查格子索引是否合法
        const _grid_data = board.m_pGridData[iGridX] ?? [];
        const grid_data = _grid_data[iGridY];
        if (!grid_data) {
            SLError('CBaseMTBlock: 格子索引错误');
        }
        this._m_iGridX = iGridX;
        this._m_iGridY = iGridY;
        const target_pos = grid_data.center;
        //如果不是地板，设置层数
        if (this.constructor.name != 'CMTBlock_Floor') {
            const mem_addr = tostring(this);
            const old_data = grid_data.block_floor[mem_addr];
            if (old_data) {
                grid_data.floor_blocks[old_data] = null;
                grid_data.floor_blocks[this.m_iFloorID] = this;
            } else {
                grid_data.floor_blocks[this.m_iFloorID] = this;
                grid_data.block_floor[mem_addr] = this.m_iFloorID;
            }
        }

        target_pos.z = this.m_iZIndex;
        this.m_pEntity.SetAbsOrigin(target_pos);
    }

    /**面朝方向 */
    private _m_Direction: BlockFaceDirection = 'UP';

    public get m_Direction(): BlockFaceDirection {
        return this._m_Direction;
    }

    public set m_Direction(value: BlockFaceDirection) {
        this._SetFaceDirection(value);
    }

    private _SetFaceDirection(sDirection: BlockFaceDirection): void {
        //根据方向设置角度
        let angle = 0;
        switch (sDirection) {
            case 'UP':
                angle = 0;
                break;
            case 'DOWN':
                angle = 180;
                break;
            case 'LEFT':
                angle = 90;
                break;
            case 'RIGHT':
                angle = 270;
                break;
            default:
                SLWarning(this.constructor.name, '设置方向错误');
                break;
        }
        this._m_Direction = sDirection;
        this.m_pEntity.SetAbsAngles(0, angle, 0);

        //调试绘制
        DebugDrawText(this.m_pEntity.GetAbsOrigin(), `direction = ${sDirection}`, true, 10);
        DebugDrawCircle(this.m_pEntity.GetAbsOrigin(), Vector(255, 0, 0), 255, 5, true, 10);
        const direction = AnglesToVector(QAngle(0, angle + 90, 0));
        const endPosition = this.m_pEntity.GetAbsOrigin().__add(direction.__mul(100));
        DebugDrawLine(this.m_pEntity.GetAbsOrigin(), endPosition, 255, 0, 0, true, 10);
    }

    public AddNoDraw(): void {
        this.m_pEntity.AddEffects(EntityEffects.EF_NODRAW);
    }

    public RemoveNoDraw(): void {
        this.m_pEntity.RemoveEffects(EntityEffects.EF_NODRAW);
    }
}

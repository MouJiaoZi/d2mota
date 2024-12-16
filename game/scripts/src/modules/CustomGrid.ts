@reloadable
export class CustomGridNav {
    constructor() {
        SLPrint('CustomGridNav constructor');
    }

    /**格子在横向、纵向的数量 */
    public readonly GridColRows = 11;

    /**每个棋盘的偏移 */
    public readonly GridCenterOffset = 7000;

    /**棋盘列数 */
    public readonly BoardCols = 4;

    /**棋盘行数 */
    public readonly BoardRows = 4;

    /**最大棋盘编号 */
    public readonly MaxBoardIndex = this.BoardCols * this.BoardRows - 1;

    /**左上角那个棋盘的中心点 */
    public readonly TopLeftBoardCenter = Vector(-13000, 13000);

    /**获取格子的中心点 */
    public GetGridCenter(col: number, row: number): Vector {
        return Vector(this.TopLeftBoardCenter.x + col * this.GridCenterOffset, this.TopLeftBoardCenter.y - row * this.GridCenterOffset);
    }

    public DebugShowGrid(): void {
        let _delay = 0;
        for (let i = 0; i < this.BoardCols; i++) {
            for (let j = 0; j < this.BoardRows; j++) {
                //获取格子的中心点
                const center = this.GetGridCenter(j, i);
                _delay = _delay + 1;
                const delay = _delay;
                const id = `${delay}: ${i}_${j}`;
                Timers.CreateTimer(delay, () => {
                    const hero = PlayerResource.GetSelectedHeroEntity(0);
                    if (hero) {
                        FindClearSpaceForUnit(hero, center, true);
                        CenterCameraOnUnit(0, hero);
                    }
                    DebugDrawText(center, `${id}`, true, 10);
                    //蓝色标记
                    DebugDrawCircle(center, Vector(0, 0, 255), 10, 10, true, 10);
                    //这是第几个？
                    //单个棋盘总宽或者
                    const width = this.GridColRows * GridSize;
                    //棋盘左上角
                    const boardleftTop = (center + Vector(-width / 2, width / 2)) as Vector;
                    //黄色标记
                    DebugDrawCircle(boardleftTop, Vector(255, 255, 0), 10, 10, true, 10);
                    //画出格子
                    for (let x = 0; x < this.GridColRows; x++) {
                        for (let y = 0; y < this.GridColRows; y++) {
                            //找出格子的中心点 应该是
                            const gridCenter = (boardleftTop + Vector((x + 0.5) * GridSize, -(y + 0.5) * GridSize)) as Vector;
                            //得出左上、左下、右下、右上四个点
                            const leftTop = (gridCenter + Vector(-GridSize / 2, GridSize / 2)) as Vector;
                            const leftBottom = (gridCenter + Vector(-GridSize / 2, -GridSize / 2)) as Vector;
                            const rightBottom = (gridCenter + Vector(GridSize / 2, -GridSize / 2)) as Vector;
                            const rightTop = (gridCenter + Vector(GridSize / 2, GridSize / 2)) as Vector;
                            //画出格子的四条边
                            DebugDrawLine(leftTop, rightTop, 255, 255, 255, true, 10);
                            DebugDrawLine(rightTop, rightBottom, 255, 255, 255, true, 10);
                            DebugDrawLine(rightBottom, leftBottom, 255, 255, 255, true, 10);
                            DebugDrawLine(leftBottom, leftTop, 255, 255, 255, true, 10);
                        }
                    }
                });
            }
        }
    }

    public readonly m_GridInstances: GridInstance[] = [];

    private m_gridInstanceCreated: boolean = false;

    //创建棋盘，棋盘是个N*N，保存每个格子的信息
    public CreatePlayerGrid(): void {
        if (this.m_gridInstanceCreated) {
            return;
        }
        this.m_gridInstanceCreated = true;
        for (let i = 0; i < this.BoardCols; i++) {
            for (let j = 0; j < this.BoardRows; j++) {
                const center = this.GetGridCenter(i, j);
                const grid = new GridInstance(center, this.m_GridInstances.length);
                this.m_GridInstances.push(grid);
                //给格子生成地板
                for (const gridData1 of Object.values(grid.m_pGridData)) {
                    for (const gridData of Object.values(gridData1)) {
                        gridData.floor = new CMTBlock_Floor(grid.m_iBoardIndex, gridData.x, gridData.y, -1 as TowerFloorID);
                    }
                }
            }
        }
    }

    public GetGridInstance(index: number): GridInstance {
        return this.m_GridInstances[index];
    }
}

class GridInstance {
    /**格子的数据 */
    public readonly m_pGridData: GridData[][] = [];
    /**棋盘索引 */
    public readonly m_iBoardIndex: number = -1;
    /**棋盘的当前楼层ID */
    private _m_CurrentFloorID: TowerFloorID = 0 as TowerFloorID;
    public get m_CurrentFloorID(): TowerFloorID {
        return this._m_CurrentFloorID;
    }

    public set m_CurrentFloorID(value: TowerFloorID) {
        this._m_CurrentFloorID = value;
    }

    constructor(center: Vector, index: number) {
        this.m_iBoardIndex = index;
        //单个棋盘总宽或者
        const width = CustomGrid.GridColRows * GridSize;
        //棋盘左上角
        const boardleftTop = (center + Vector(-width / 2, width / 2)) as Vector;
        for (let col = 0; col < CustomGrid.GridColRows; col++) {
            this.m_pGridData[col] = [];
            for (let row = 0; row < CustomGrid.GridColRows; row++) {
                //找出格子的中心点 应该是
                const gridCenter = (boardleftTop + Vector((col + 0.5) * GridSize, -(row + 0.5) * GridSize)) as Vector;
                const index = row * CustomGrid.GridColRows + col;
                this.m_pGridData[col][row] = {
                    center: gridCenter,
                    index: index,
                    x: col,
                    y: row,
                    floor_blocks: {},
                    block_floor: {},
                    floor_inited: {},
                    floor: null,
                };
                // DebugDrawText(gridCenter, `${index},${col},${row}`, true, 30);
            }
        }
        // SLPrint('GridInstance', center, index);
        // DeepPrintTable(this.m_pGridData);
    }

    public get GridDataArray(): GridData[] {
        return this.m_pGridData.flat();
    }

    //切换楼层
    public SwitchToFloor(floorID: TowerFloorID): void {
        const old_floor = this._m_CurrentFloorID;
        // 新旧楼层相同，直接返回
        if (old_floor == floorID) {
            return;
        }
        //如果新旧楼层不同，遍历所有格子
        for (const grid of this.GridDataArray) {
            //隐藏旧楼层的方块
            const old_block = grid.floor_blocks[old_floor];
            if (old_block) {
                old_block.AddNoDraw();
            }
            //如果新楼层已经初始化了，显示新楼层的方块
            if (grid.floor_inited[floorID]) {
                const new_block = grid.floor_blocks[floorID];
                if (new_block) {
                    new_block.RemoveNoDraw();
                }
            } else {
                //如果新楼层没有初始化，初始化新楼层
                //TODO 初始化新楼层
            }
        }
    }
}

declare global {
    var CustomGrid: CustomGridNav;
}

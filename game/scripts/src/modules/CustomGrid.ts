@reloadable
export class CustomGridNav {
    constructor() {
        SLPrint('CustomGridNav constructor');
    }

    /**每个格子有多大 */
    public readonly GridSize = 256;

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
                const center = this.GetGridCenter(i, j);
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
                    const width = this.GridColRows * this.GridSize;
                    //棋盘左上角
                    const boardleftTop = (center + Vector(-width / 2, width / 2)) as Vector;
                    //黄色标记
                    DebugDrawCircle(boardleftTop, Vector(255, 255, 0), 10, 10, true, 10);
                    //画出格子
                    for (let x = 0; x < this.GridColRows; x++) {
                        for (let y = 0; y < this.GridColRows; y++) {
                            //找出格子的中心点 应该是
                            const gridCenter = (boardleftTop + Vector((x + 0.5) * this.GridSize, -(y + 0.5) * this.GridSize)) as Vector;
                            //得出左上、左下、右下、右上四个点
                            const leftTop = (gridCenter + Vector(-this.GridSize / 2, this.GridSize / 2)) as Vector;
                            const leftBottom = (gridCenter + Vector(-this.GridSize / 2, -this.GridSize / 2)) as Vector;
                            const rightBottom = (gridCenter + Vector(this.GridSize / 2, -this.GridSize / 2)) as Vector;
                            const rightTop = (gridCenter + Vector(this.GridSize / 2, this.GridSize / 2)) as Vector;
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
                this.m_GridInstances.push(new GridInstance(center));
            }
        }
    }

    public GetGridInstance(index: number): GridInstance {
        return this.m_GridInstances[index];
    }
}

class GridInstance {
    private _grid_map: GridData[][] = [];

    constructor(center: Vector) {
        //单个棋盘总宽或者
        const width = CustomGrid.GridColRows * CustomGrid.GridSize;
        //棋盘左上角
        const boardleftTop = (center + Vector(-width / 2, width / 2)) as Vector;
        for (let x = 0; x < CustomGrid.GridColRows; x++) {
            this._grid_map[x] = [];
            for (let y = 0; y < CustomGrid.GridColRows; y++) {
                //找出格子的中心点 应该是
                const gridCenter = (boardleftTop + Vector((x + 0.5) * CustomGrid.GridSize, -(y + 0.5) * CustomGrid.GridSize)) as Vector;
                this._grid_map[x][y] = {
                    center: gridCenter,
                    index: x * CustomGrid.GridColRows + y,
                    block: null,
                };
            }
        }
        // SLPrint('GridInstance', center);
        // DeepPrintTable(this._grid_map);
    }
}

declare global {
    var CustomGrid: CustomGridNav;
}

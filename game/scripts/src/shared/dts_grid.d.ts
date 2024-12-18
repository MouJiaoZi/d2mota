declare type TowerFloorID = number & { __tower_floor_id: never };

declare interface GridData {
    center: Vector;
    index: number;
    x: number;
    y: number;
    /**该地点在每层对应的方块 */
    floor_blocks: Record<TowerFloorID, CBaseMTBlock | null>;
    /**方块-层 */
    block_floor: Record<string, TowerFloorID>;
    floor: CMTBlock_Floor;
}

declare type BlockTypeID = number & { __block_type_id: never };

declare type BlockConstructor<T extends CBaseMTBlock> = new (iBoardIndex: number, iGridX: number, iGridY: number, iFloorID: TowerFloorID) => T;

declare type BlockFaceDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

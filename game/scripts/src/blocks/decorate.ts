const ID_TO_BLOCK: Record<number, BlockConstructor<CBaseMTBlock>> = {};

const registerBlock =
    <T extends CBaseMTBlock>(iBlockID: BlockTypeID) =>
    (constructor: BlockConstructor<T>) => {
        if (!iBlockID) {
            SLError('registerBlock: 未传入方块ID', constructor.name);
        }
        if (ID_TO_BLOCK[iBlockID]) {
            SLError('registerBlock: 方块ID重复', constructor.name, '原方块', ID_TO_BLOCK[iBlockID].name);
        }
        SLPrint('registerBlock', iBlockID, constructor.name);
        ID_TO_BLOCK[iBlockID] = constructor;
        reloadable(constructor);
    };

function GetBlockConstructor(iBlockID: BlockTypeID): BlockConstructor<CBaseMTBlock> {
    return ID_TO_BLOCK[iBlockID];
}

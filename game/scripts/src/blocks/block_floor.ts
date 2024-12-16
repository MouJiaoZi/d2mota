@registerBlock(0 as BlockTypeID)
class CMTBlock_Floor extends CBaseMTBlock {
    protected _m_bTreavalable: boolean = true;
    public m_iZIndex: number = 0;

    protected EntitySpawnFunction(): void {
        this.m_pEntity = SpawnEntityFromTableSynchronous('prop_dynamic', {
            model: 'models/blocks/test_floor.vmdl',
            // model: 'models/props_structures/ramp_wall_cntr_001b.vmdl',
        });
    }
}

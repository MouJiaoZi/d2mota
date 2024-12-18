@registerBlock(0 as BlockTypeID)
class CMTBlock_Floor extends CBaseMTBlock {
    protected _m_bTreavalable: boolean = true;

    protected EntitySpawnFunction(): void {
        this.m_pEntity = SpawnEntityFromTableSynchronous('prop_dynamic', {
            model: 'models/blocks/test_floor.vmdl',
            // model: 'models/props_structures/ramp_wall_cntr_001b.vmdl',
        });
        this.m_iZIndex = 0;
    }
}

@registerBlock(1 as BlockTypeID)
class CMTBlock_Wall extends CBaseMTBlock {
    protected _m_bTreavalable: boolean = false;

    protected EntitySpawnFunction(): void {
        this.m_pEntity = SpawnEntityFromTableSynchronous('prop_dynamic', {
            model: 'models/blocks/test_wall.vmdl',
        });
        this.m_iZIndex = 1;
    }
}

@registerBlock(3 as BlockTypeID)
class CMTBlock_Lava extends CBaseMTBlock {
    protected _m_bTreavalable: boolean = false;

    protected EntitySpawnFunction(): void {
        this.m_pEntity = SpawnEntityFromTableSynchronous('prop_dynamic', {
            model: 'models/blocks/test_lava.vmdl',
            // model: 'models/props_structures/ramp_wall_cntr_001b.vmdl',
        });
        this.m_iZIndex = 1;
    }
}

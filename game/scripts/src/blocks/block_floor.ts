class CMTBlock_Floor extends CBaseMTBlock {
    constructor(iBoardIndex: number, iGridX: number, iGridY: number) {
        super(iBoardIndex, iGridX, iGridY, 0);
        //设置可通行
        this.SetTreavalable(true);
    }

    protected EntitySpawnFunction(): void {
        this.m_pEntity = SpawnEntityFromTableSynchronous('prop_dynamic', {
            model: 'models/blocks/test_lava.vmdl',
            origin: Vector(0, 0, 0),
        });
    }
}

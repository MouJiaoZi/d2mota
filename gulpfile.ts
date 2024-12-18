import gulp from 'gulp';
import * as dotax from 'gulp-dotax';
import path from 'path';
import less from 'gulp-less';
import replace from 'gulp-replace';
import excel from 'node-xlsx';
import through2 from 'through2';
import type Vinyl from 'vinyl';
import fs from 'fs';

const paths: { [key: string]: string } = {
    excels: 'excels',
    kv: 'game/scripts/npc',
    src_json: 'game/scripts/src/json',
    panorama_json: 'content/panorama/src/json',
    panorama: 'content/panorama',
    game_resource: 'game/resource',
};

interface TowerBlockConfig {
    block_id: number;
    //第几行
    row: number;
    //第几列
    col: number;
    type: 'NORMAL' | 'TELE';
    face: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    //传送专属内容 传送目标楼层id
    tele_floor_id?: number;
    //传送专属内容 传送目标行
    tele_row?: number;
    //传送专属内容 传送目标列
    tele_col?: number;
}

/**
 * 魔塔配置表转换
 * @param watch
 * @returns
 */
const tower_config =
    (watch: boolean = false) =>
    () => {
        // 配置表路径
        const excelFiles = './tower_config.xlsx';
        // 魔塔地形有几行几列 默认11*11
        const row_cols = 11;
        // 转换配置
        const convertConfig = () => {
            function convert(this: any, file: Vinyl, enc: any, next: Function) {
                if (file.isNull()) {
                    return next(null, file);
                }
                if (!file.basename.endsWith(`.xlsx`) && !file.basename.endsWith(`.xls`)) {
                    console.log(`你指派的文件${file.basename}不是excel文件`);
                    return next();
                }
                if (file.isBuffer()) {
                    //处理表，记得去掉所有空格
                    const sheets = excel.parse(file.contents);

                    // 魔塔方块名字到id的映射
                    const tower_block_name_to_id: Record<string, number> = {};

                    function getBlockId(name: string): number | undefined {
                        if (!Number.isNaN(Number(name))) {
                            return Number(name);
                        }
                        return tower_block_name_to_id[name];
                    }

                    function getBlockFace(face: 'w' | 's' | 'a' | 'd'): 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' {
                        switch (face) {
                            case 'w':
                                return 'UP';
                            case 's':
                                return 'DOWN';
                            case 'a':
                                return 'LEFT';
                            case 'd':
                                return 'RIGHT';
                            default:
                                return 'UP';
                        }
                    }

                    // 先读映射
                    for (const sheet of sheets) {
                        if (sheet.name == 'name_id') {
                            const data = sheet.data as string[][];
                            //该表只读有前两列且前两列都有内容的行，第一列是别名，第二列是id
                            //预留：TELE
                            const keeps = ['TELE'];
                            for (let i = 1; i < data.length; i++) {
                                const line = data[i];
                                if (line[0] != undefined && line[1] != undefined && !Number.isNaN(Number(line[1]))) {
                                    if (keeps.includes(line[0].trim())) {
                                        console.log(`魔塔方块别名ID映射 ${line[0]} -> ${line[1]}   与保留关键字冲突，跳过`);
                                        continue;
                                    }
                                    console.log(`添加了魔塔方块别名ID映射 ${line[0]} -> ${line[1]}`);
                                    tower_block_name_to_id[line[0].trim()] = Number(line[1]);
                                }
                            }
                        }
                    }

                    // 再读配置
                    for (const sheet of sheets) {
                        if (sheet.name == 'config') {
                            // 读取第一个sheet
                            const data = sheets[0].data as string[][];
                            //一共有几行
                            const rows = data.length;
                            // console.log(data);
                            // 楼层配置开始行数
                            const floor_start_rows: number[] = [];
                            //从第一行开始解析到最后一行
                            for (let i = 0; i < rows; i++) {
                                const line = data[i];
                                console.log(`检查第${i}行的数据`);
                                // console.log(line.length);
                                // 一层的配置开始，是有一行第1列有内容，且他下面的row_cols-1行都没有内容
                                // console.log(line[0]);
                                let check_pass = false;
                                if (line[0] != undefined) {
                                    for (let j = 1; j < row_cols; j++) {
                                        if (data[i + j] != undefined && data[i + j][0] != undefined) {
                                            check_pass = false;
                                            break;
                                        }
                                        check_pass = true;
                                    }
                                }
                                if (check_pass) {
                                    floor_start_rows.push(i);
                                    console.log(`第${i}行是楼层配置开始   下一次检查应该从第${i + row_cols}行开始`);
                                    i = i + row_cols - 1;
                                }
                            }
                            // 每个楼层的配置
                            const floor_configs: Record<number, TowerBlockConfig[]> = {};
                            // 魔塔总配置
                            const tower_configs = {
                                player_start: { floor_id: 0, x: 0, y: 0 },
                                floors: {},
                            };
                            for (const index of floor_start_rows) {
                                if (data[index][0] == undefined) {
                                    console.log(`第${index}行没有楼层编号`);
                                    continue;
                                }
                                const floor_id = Number(data[index][0]);
                                if (Number.isNaN(floor_id)) {
                                    console.log(`第${index}行楼层编号不是数字`);
                                    continue;
                                }
                                console.log(`开始解析楼层编号 ${floor_id} 的配置`);
                                floor_configs[floor_id] = [];
                                for (let i = 0; i < row_cols; i++) {
                                    // 每一行的配置
                                    const line = data[index + i];
                                    for (let j = 1; j <= row_cols; j++) {
                                        if (line[j] != undefined) {
                                            // 该方块的配置，移除所有空格
                                            const block_configs = line[j].toString().trim().split('&');
                                            const block_ts_config: TowerBlockConfig = {
                                                block_id: -1,
                                                row: i,
                                                col: j - 1,
                                                type: 'NORMAL',
                                                face: 'UP',
                                            };
                                            if (block_configs[0] == 'TELE') {
                                                //解析传送方块
                                                block_ts_config.type = 'TELE';
                                                const [_, block, face, tele_floor_id, tele_col, tele_row] = block_configs;
                                                const block_id = getBlockId(block);
                                                if (block_id == undefined) {
                                                    console.log(`第${index + i}行第${j}列的方块${block}未找到对应id`);
                                                    continue;
                                                }
                                                const block_face = getBlockFace(face as 'w' | 's' | 'a' | 'd');
                                                const block_tele_floor_id = Number.isNaN(tele_floor_id) ? floor_id : Number(tele_floor_id);
                                                const block_tele_col = tele_col == undefined || Number.isNaN(tele_col) ? j - 1 : Number(tele_col);
                                                const block_tele_row = tele_row == undefined || Number.isNaN(tele_row) ? i : Number(tele_row);
                                                block_ts_config.block_id = block_id;
                                                block_ts_config.face = block_face;
                                                block_ts_config.tele_floor_id = block_tele_floor_id;
                                                block_ts_config.tele_col = block_tele_col;
                                                block_ts_config.tele_row = block_tele_row;
                                            } else {
                                                //解析普通方块
                                                const [block, face] = block_configs;
                                                const block_id = getBlockId(block);
                                                if (block_id == undefined) {
                                                    console.log(`第${index + i}行第${j}列的方块${block}未找到对应id`);
                                                    continue;
                                                }
                                                block_ts_config.block_id = block_id;
                                                block_ts_config.face = getBlockFace(face as 'w' | 's' | 'a' | 'd');
                                            }
                                            floor_configs[floor_id].push(block_ts_config);
                                        }
                                    }
                                }
                                console.log(floor_configs[floor_id]);
                            }

                            // 生成配置
                            tower_configs.floors = floor_configs;
                            console.log(tower_configs);
                            // 生成json配置文件
                            const jsonFileName = './game/scripts/src/json/tower_config.json';
                            fs.writeFileSync(jsonFileName, JSON.stringify(tower_configs, null, 2));
                        }
                    }
                }
                next();
            }
            return through2.obj(convert);
        };
        const transpileSheets = () => {
            return gulp.src(excelFiles).pipe(convertConfig());
        };

        if (watch) {
            return gulp.watch(excelFiles, transpileSheets);
        } else {
            return transpileSheets();
        }
    };

/**
 * @description 将excel文件转换为kv文件
 * @description Convert your excel file to kv file
 */
const sheet_2_kv =
    (watch: boolean = false) =>
    () => {
        const excelFiles = `${paths.excels}/**/*.{xlsx,xls}`;
        const transpileSheets = () => {
            return gulp
                .src(excelFiles)
                .pipe(
                    dotax.sheetToKV({
                        // 所有支持的参数请按住 Ctrl 点击 sheetToKV 查看，以下其他 API 也是如此
                        sheetsIgnore: '^__.*|^Sheet[1-3]$', // 忽略以两个下划线开头的sheet 和 默认生成的 Sheet1 Sheet2 Sheet3 等
                        indent: `	`, // 自定义缩进
                        addonCSVPath: `${paths.game_resource}/kv_generated.csv`, // 本地化文件路径，用以将 excel 文件中的 #Loc{}输出到addon.csv文件中去
                    })
                )
                .pipe(gulp.dest(paths.kv));
        };

        if (watch) {
            return gulp.watch(excelFiles, transpileSheets);
        } else {
            return transpileSheets();
        }
    };

/**
 * @description 将kv文件转换为panorama使用的json文件
 * @description Convert your kv file to panorama json file
 */
const kv_2_js =
    (watch: boolean = false) =>
    () => {
        const kvFiles = `${paths.kv}/**/*.{kv,txt}`;
        const transpileKVToJS = () => {
            return gulp.src(kvFiles).pipe(dotax.kvToJS()).pipe(gulp.dest(paths.panorama_json)).pipe(gulp.dest(paths.src_json));
        };

        if (watch) {
            return gulp.watch(kvFiles, transpileKVToJS);
        } else {
            return transpileKVToJS();
        }
    };

/**
 * @description 从 kv 文件中提取所有需要的本地化词条，你可以使用 customPrefix 和 customSuffix 之类的参数来指定自己的前缀和后缀
 * @description Extract all description from kv file, you can use customPrefix and customSuffix to specify your prefix and suffix
 */
const kv_to_local = () => () => {
    return gulp.src(`${paths.kv}/**/*.{kv,txt}`).pipe(
        dotax.kvToLocalsCSV(`${paths.game_resource}/addon.csv`, {
            // customPrefix: (key, data, path) => {
            //     if (data.BaseClass && /ability_/.test(data.BaseClass)) {
            //         if (data.ScriptFile && data.ScriptFile.startsWith('abilities/combos/')) {
            //             return 'dota_tooltip_ability_combo_';
            //         } else if (data.ScriptFile && /^/.test(data.ScriptFile)) {
            //             return 'dota_tooltip_ability_chess_ability_';
            //         } else {
            //             return 'dota_tooltip_ability_';
            //         }
            //     }
            //     return '';
            // },
            // customSuffix: (key, data, path) => {
            //     let suffix = [''];
            //     if (data.ScriptFile && data.ScriptFile.startsWith('abilities/combos/')) {
            //         suffix = ['_description'];
            //         let maxLevel = data.MaxLevel;
            //         if (maxLevel) {
            //             suffix = suffix.concat(
            //                 Array.from({ length: maxLevel }, (_, i) => `_level${i + 1}`)
            //             );
            //         }
            //     }
            //     return suffix;
            // },
            // exportAbilityValues: false,
        })
    );
};

/**
 * @description 将 resource/*.csv 中的本地化文本转换为 addon_*.txt 文件
 * @description Convert resource/*.csv local text to addon_*.txt file
 *
 */
const csv_to_localization =
    (watch: boolean = false) =>
    () => {
        const addonCsv = `${paths.game_resource}/*.csv`;
        const transpileAddonCSVToLocalization = () => {
            return gulp.src(addonCsv).pipe(dotax.csvToLocals(paths.game_resource));
        };
        if (watch) {
            return gulp.watch(addonCsv, transpileAddonCSVToLocalization);
        } else {
            return transpileAddonCSVToLocalization();
        }
    };

/**
 * @description 将现有的 addon_*.txt 文件转换为 addon.csv 文件，这个 task 是为了使这个task适配你原有的开发方式，如果是重新开发，则无需运行这个task
 * @description Convert addon_*.txt file to addon.csv file, this task is for adapting your original development method, if you are re-developing, you don't need to run this task
 */
const localization_2_csv = () => {
    return dotax.localsToCSV(`${paths.game_resource}/addon_*.txt`, `${paths.game_resource}/addon.csv`);
};

/**
 * 将panorama/images目录下的jpg,png,psd文件集合到 dest 目录中的 image_precache.css文件中
 * 使用这个 task ，你可以在 game setup 阶段的时候，将所有的图片都编译而不用自己写
 */
const create_image_precache =
    (watch: boolean = false) =>
    () => {
        const imageFiles = `${paths.panorama}/images/**/*.{jpg,png,psd}`;
        const createImagePrecache = () => {
            return gulp.src(imageFiles).pipe(dotax.imagePrecacche(`content/panorama/images/`)).pipe(gulp.dest(paths.panorama));
        };
        if (watch) {
            return gulp.watch(imageFiles, createImagePrecache);
        } else {
            return createImagePrecache();
        }
    };

/** compile all less files to panorama path */
const compile_less =
    (watch: boolean = false) =>
    () => {
        const lessFiles = `${paths.panorama}/src/**/*.less`;
        const compileLess = () => {
            return (
                gulp
                    .src(lessFiles)
                    .pipe(less())
                    // valve 对于 @keyframes 有特殊的格式要求，需要将 @keyframes 的名称用单引号包裹
                    .pipe(replace(/@keyframes\s*(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g, (match, name) => match.replace(name, `'${name}'`)))
                    .pipe(gulp.dest(path.join(paths.panorama, 'layout/custom_game')))
            );
        };
        if (watch) {
            return gulp.watch(lessFiles, compileLess);
        } else {
            return compileLess();
        }
    };

/**
 * start a file sserver to save/read files
 */
const fsServer = require('./scripts/fs');
const p = process.cwd();
const start_file_server = (callback: Function) => {
    const server = fsServer(p);

    server.on('file', (name: string) => {
        console.log('file: ' + name);
    });
    server.on('directory', (name: string) => {
        console.log('directory: ' + name);
    });

    server.listen(10384, () => {
        console.log('file server listening on port 10384');
        callback();
    });
};

gulp.task('start_file_server', start_file_server);

gulp.task('localization_2_csv', localization_2_csv);

gulp.task(`create_image_precache`, create_image_precache());
gulp.task('create_image_precache:watch', create_image_precache(true));

gulp.task('sheet_2_kv', sheet_2_kv());
gulp.task('sheet_2_kv:watch', sheet_2_kv(true));

gulp.task('kv_2_js', kv_2_js());
gulp.task('kv_2_js:watch', kv_2_js(true));

gulp.task('csv_to_localization', csv_to_localization());
gulp.task('csv_to_localization:watch', csv_to_localization(true));

gulp.task('compile_less', compile_less());
gulp.task('compile_less:watch', compile_less(true));

gulp.task('tower_config', tower_config());
gulp.task('tower_config:watch', tower_config(true));

gulp.task('predev', gulp.series('sheet_2_kv', 'kv_2_js', 'csv_to_localization', 'create_image_precache', 'compile_less', 'tower_config'));
gulp.task(
    'dev',
    gulp.parallel(
        'sheet_2_kv:watch',
        'csv_to_localization:watch',
        'create_image_precache:watch',
        'kv_2_js:watch',
        'compile_less:watch',
        'tower_config:watch'
    )
);
gulp.task('build', gulp.series('predev'));
gulp.task('jssync', gulp.series('sheet_2_kv', 'kv_2_js'));
gulp.task('kv_to_local', kv_to_local());
gulp.task('prod', gulp.series('predev'));

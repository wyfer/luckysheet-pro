function isRealNum(val) {
    if (val === "" || val == null) {
        return false;
    }
    if (!isNaN(val)) {
        return true;
    } else {
        return false;
    }
}

function getObjType(obj) {
    var toString = Object.prototype.toString;

    var map = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object'
    }

    // if(obj instanceof Element){
    //     return 'element';
    // }

    return map[toString.call(obj)];
}


function getRangeSplitArray(
    chartData,
    rangeArray,
    rangeColCheck,
    rangeRowCheck
) {
    var rangeSplitArray = {};
    //生成类似excel的图表选区
    if (rangeArray.length > 1) {
        //上左、上右、下左、下右
        rangeSplitArray = {
            title: { row: [0, 0], column: [0, 0] },
            rowtitle: { row: [0, 0], column: [1, chartData[0].length - 1] },
            coltitle: { row: [1, chartData.length - 1], column: [0, 0] },
            content: {
                row: [1, chartData.length - 1],
                column: [1, chartData[0].length - 1]
            },
            type: "multi",
            range: rangeArray
        };
    }

    //转置
    //处理规则：根据不转置的情况，变换取值范围，coltitle和rowtitle交换，内部row和column交换，content的row和column交换，最后在getChartDataCache中转置整个区域数据时候取值时候即可取到正确范围的数据
    // if(rangeConfigCheck){
    // 	//上左、上右、下左、下右
    // 	if (rangeColCheck.exits && rangeRowCheck.exits) {
    // 		rangeSplitArray = {
    // 			"title": { column: rangeRowCheck.range, row: rangeColCheck.range },
    // 			"coltitle": { column: rangeRowCheck.range, row: [rangeColCheck.range[1] + 1, chartData[0].length - 1] },
    // 			"rowtitle": { column: [rangeRowCheck.range[1] + 1, chartData.length - 1], row: rangeColCheck.range },
    // 			"content": { column: [rangeRowCheck.range[1] + 1, chartData.length - 1], row: [rangeColCheck.range[1] + 1, chartData[0].length - 1] }, type: "normal", range: rangeArray[0]
    // 		};
    // 	}
    // 	//左、右，没有行标题
    // 	else if (rangeColCheck.exits) {
    // 		rangeSplitArray = {
    // 			"title": null,
    // 			"coltitle": null,
    // 			"rowtitle": { row: [0, chartData.length - 1], column: rangeColCheck.range },
    // 			"content": { row: [0, chartData.length - 1], column: [rangeColCheck.range[1] + 1, chartData[0].length - 1] }, type: "leftright", range: rangeArray[0] };
    // 	}
    // 	//上、下，没有列标题
    // 	else if (rangeRowCheck.exits) {
    // 		rangeSplitArray = {
    // 			"title": null,
    // 			"coltitle": { row: rangeRowCheck.range, column: [0, chartData[0].length - 1] },
    // 			"rowtitle": null,
    // 			"content": { row: [rangeRowCheck.range[1] + 1, chartData.length - 1], column: [0, chartData[0].length - 1] }, type: "topbottom", range: rangeArray[0] };
    // 	}
    // 	//无标题，纯数据没有标题
    // 	else {
    // 		rangeSplitArray = {
    // 			"title": null,
    // 			"coltitle": null,
    // 			"rowtitle": null,
    // 			"content": { row: [0, chartData.length - 1], column: [0, chartData[0].length - 1] }, type: "contentonly", range: rangeArray[0] };
    // 	}
    // }else{ //不转置
    //上左、上右、下左、下右
    if (rangeColCheck.exits && rangeRowCheck.exits) {
        rangeSplitArray = {
            title: { row: rangeRowCheck.range, column: rangeColCheck.range },
            rowtitle: {
                row: rangeRowCheck.range,
                column: [rangeColCheck.range[1] + 1, chartData[0].length - 1]
            },
            coltitle: {
                row: [rangeRowCheck.range[1] + 1, chartData.length - 1],
                column: rangeColCheck.range
            },
            content: {
                row: [rangeRowCheck.range[1] + 1, chartData.length - 1],
                column: [rangeColCheck.range[1] + 1, chartData[0].length - 1]
            },
            type: "normal",
            range: rangeArray[0]
        };
    }
    //左、右，没有行标题
    else if (rangeColCheck.exits) {
        //处理"content"：如果列标题的列数等于整个数据的列数，则没有内容
        rangeSplitArray = {
            title: null,
            rowtitle: null,
            coltitle: {
                row: [0, chartData.length - 1],
                column: rangeColCheck.range
            },
            content: {
                row: [0, chartData.length - 1],
                column: [rangeColCheck.range[1] + 1, chartData[0].length - 1]
            },
            type: "leftright",
            range: rangeArray[0]
        };
    }
    //上、下，没有列标题
    else if (rangeRowCheck.exits) {
        //处理"content"：如果行标题的行数等于整个数据的行数，则没有内容
        rangeSplitArray = {
            title: null,
            rowtitle: {
                row: rangeRowCheck.range,
                column: [0, chartData[0].length - 1]
            },
            coltitle: null,
            content: {
                row: [rangeRowCheck.range[1] + 1, chartData.length - 1],
                column: [0, chartData[0].length - 1]
            },
            type: "topbottom",
            range: rangeArray[0]
        };
    }
    //无标题，纯数据没有标题
    else {
        rangeSplitArray = {
            title: null,
            rowtitle: null,
            coltitle: null,
            content: {
                row: [0, chartData.length - 1],
                column: [0, chartData[0].length - 1]
            },
            type: "contentonly",
            range: rangeArray[0]
        };
    }
    // }
    // console.dir(rangeSplitArray)
    return rangeSplitArray;
}

function getRowColCheck(data) {
    //从右下角开始，按照斜角网上遍历，如果非数字格式则取得上一个斜角的行列值。然后分别按行和按列往左遍历，遇到非数字则记0-i为列头或行头
    var r = data.length - 1,
        c = data[0].length - 1
    var r_cal, c_cal
    while (r >= 0 && c >= 0) {
        var cell = data[r][c]
        //cell的可能值,都判断为同数字一样略过，不作为标题
        //1.cell = 3;
        //2.cell = {v:3}
        //3.cell = {}
        //4.cell = ""
        //5.cell.v = ""
        if (
            cell === null ||
            isRealNum(cell) ||
            (getObjType(cell) == 'object' && isRealNum(cell.v)) ||
            (getObjType(cell) == 'object' &&
                getObjType(cell.v) == 'undefined') ||
            cell === '' ||
            cell.v === ''
        ) {
            if (cell && cell.ct && cell.ct.fa == 'yyyy-MM-dd') {
                r_cal = r + 1
                c_cal = c + 1
                break
            } else {
                r_cal = r--
                c_cal = c--
            }
        } else {
            if (r == data.length - 1 && c == data[0].length - 1) {
                r_cal = r
                c_cal = c
            } else {
                r_cal = r + 1
                c_cal = c + 1
            }
            break
        }
    }

    var rowcheck = { exits: false, range: [0, 0] } //默认取第一行，让设计界面的check可以有值
    if (r_cal > 0) {
        for (var i = r_cal; i >= 0; i--) {
            var cell = data[i][c_cal]
            if (
                cell === null ||
                isRealNum(cell) ||
                (getObjType(cell) == 'object' && isRealNum(cell.v)) ||
                (getObjType(cell) == 'object' &&
                    getObjType(cell.v) == 'undefined') ||
                cell === '' ||
                cell.v === ''
            ) {
            } else {
                rowcheck.exits = true
                rowcheck.range = [0, i]
                break
            }
        }
    }

    var colcheck = { exits: false, range: [0, 0] } //默认取第一列，让设计界面的check可以有值
    if (c_cal > 0) {
        for (var i = c_cal; i >= 0; i--) {
            var cell = data[r_cal][i]
            if (
                cell === null ||
                isRealNum(cell) ||
                (getObjType(cell) == 'object' && isRealNum(cell.v)) ||
                (getObjType(cell) == 'object' &&
                    getObjType(cell.v) == 'undefined') ||
                cell === '' ||
                cell.v === ''
            ) {
                if (cell && cell.ct && cell.ct.fa == 'yyyy-MM-dd') {
                    colcheck.exits = true
                    colcheck.range = [0, i]
                    break
                }
            } else {
                colcheck.exits = true
                colcheck.range = [0, i]
                break
            }
        }
    }

    //处理行标题和列标签为整个数据的时候，把标题去除，只用作内容
    if (rowcheck.range[1] + 1 == data.length) {
        rowcheck = { exits: false, range: [0, 0] }
    }
    if (colcheck.range[1] + 1 == data[0].length) {
        colcheck = { exits: false, range: [0, 0] }
    }
    // console.dir([rowcheck, colcheck])
    return [rowcheck, colcheck]
}

export {
    getRangeSplitArray,getRowColCheck
}
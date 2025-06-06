import {getColumnWidth, getRowHeight} from '../global/api'
import { rgbTohex } from './util';

var baseBorder = {
	"top": {
			"style": "thin",
			"color": {
					"argb": "e6e6e6"
			}
	},
	"right": {
			"style": "thin",
			"color": {
					"argb": "e6e6e6"
			}
	},
	"bottom": {
			"style": "thin",
			"color": {
					"argb": "e6e6e6"
			}
	},
	"left": {
			"style": "thin",
			"color": {
					"argb": "e6e6e6"
			}
	}
};

function setStyleAndValue(cellArr, worksheet) {
	if (!Array.isArray(cellArr)) {
		return;
	}
	cellArr.forEach(function (row, rowid) {
		const dbrow = worksheet.getRow(rowid+1);
		dbrow.height=getRowHeight([rowid])[rowid];

		row.every(function (cell, columnid) {
			if (rowid == 0) {
				const dobCol = worksheet.getColumn(columnid + 1);
				//设置单元格列宽除以8
				dobCol.width = getColumnWidth([columnid])[columnid] / 8;
			}
			if (!cell) {
				return true;
			}

			//设置背景色
			let bg = cell.bg || "#FFFFFF"; //默认white
			if(bg?.indexOf("rgb") > -1){
				bg = rgbTohex(bg);
			}
			// bg = bg === "yellow" ? "FFFF00" : bg?.replace("#", "");
			bg && (bg = bg.replace('#',''))
			let fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: bg },
			};
			let font = fontConvert(
				cell.ff,
				cell.fc,
				cell.bl,
				cell.it,
				cell.fs,
				cell.cl,
				cell.ul
			);
			let alignment = alignmentConvert(
				cell.vt,
				cell.ht,
				cell.tb,
				cell.tr
			);
			let value = "";

			let numFmt = null;

			if (cell.f) {
				value = { formula: cell.f, result: cell.v };
			} else if (!cell.v && cell.ct && cell.ct.s) {
				// xls转为xlsx之后，内部存在不同的格式，都会进到富文本里，即值不存在与cell.v，而是存在于cell.ct.s之后
				// value = cell.ct.s[0].v
				cell.ct.s.forEach((arr) => {
					value += arr.v;
				});
			} else if(cell.ct && cell.ct.fa && cell.ct.fa === ';;;'){
				value = cell.v;
				numFmt = ';;;';
			} else{
				value = cell.v;
			}
			//  style 填入到_value中可以实现填充色
			let letter = createCellPos(columnid);
			let target = worksheet.getCell(letter + (rowid + 1));
			
			for (const key in fill) {
				target.fill = fill;
				break;
			}

			target.font = font;
			target.alignment = alignment;
			target.value = value;

			if(numFmt) {
				target.numFmt = numFmt;
			}

			target.border = baseBorder;

			return true;
		});
	});
}

function fontConvert(
	ff = 1,
	fc = "#000000",
	bl = 0,
	it = 0,
	fs = 10,
	cl = 0,
	ul = 0
) {
	// luckysheet：ff(样式), fc(颜色), bl(粗体), it(斜体), fs(大小), cl(删除线), ul(下划线)
	const luckyToExcel = {
		0: "微软雅黑",
		1: "宋体（Song）",
		2: "黑体（ST Heiti）",
		3: "楷体（ST Kaiti）",
		4: "仿宋（ST FangSong）",
		5: "新宋体（ST Song）",
		6: "华文新魏",
		7: "华文行楷",
		8: "华文隶书",
		9: "Arial",
		10: "Times New Roman ",
		11: "Tahoma ",
		12: "Verdana",
		num2bl: function (num) {
			return num === 0 ? false : true;
		},
	};
	// 出现Bug，导入的时候ff为luckyToExcel的val
	fc = fc || "#000000";
	// ff = 0;
	// bl = 0;
	// it = 0;
	// fs = 10;
	// cl = 0;
	// ul = 0;
	let font = {
		name: typeof ff === "number" ? luckyToExcel[ff] : ff,
		family: 1,
		size: fs,
		color: { argb: fc?.replace("#", "") },
		bold: luckyToExcel.num2bl(bl),
		italic: luckyToExcel.num2bl(it),
		underline: luckyToExcel.num2bl(ul),
		strike: luckyToExcel.num2bl(cl),
	};

	return font;
}

function alignmentConvert(
	vt = "default",
	ht = "default",
	tb = "default",
	tr = "default"
) {
	// luckysheet:vt(垂直), ht(水平), tb(换行), tr(旋转)
	const luckyToExcel = {
		vertical: {
			0: "middle",
			1: "top",
			2: "bottom",
			default: "top",
		},
		horizontal: {
			0: "center",
			1: "left",
			2: "right",
			default: "left",
		},
		wrapText: {
			0: false,
			1: false,
			2: true,
			default: false,
		},
		textRotation: {
			0: 0,
			1: 45,
			2: -45,
			3: "vertical",
			4: 90,
			5: -90,
			default: 0,
		},
	};

	let alignment = {
		vertical: luckyToExcel.vertical[vt],
		horizontal: luckyToExcel.horizontal[ht],
		wrapText: luckyToExcel.wrapText[tb],
		textRotation: luckyToExcel.textRotation[tr],
	};
	return alignment;
}

function setMerge(luckyMerge = {}, worksheet) {
	const mergearr = Object.values(luckyMerge);
	mergearr.forEach(function (elem) {
		// elem格式：{r: 0, c: 0, rs: 1, cs: 2}
		// 按开始行，开始列，结束行，结束列合并（相当于 K10:M12）
		worksheet.mergeCells(
			elem.r + 1,
			elem.c + 1,
			elem.r + elem.rs,
			elem.c + elem.cs
		);
	});
}

function setBorder(luckyBorderInfo, worksheet) {
	if (!Array.isArray(luckyBorderInfo)) {
		return;
	}
	luckyBorderInfo.forEach(function (elem) {
		// 现在只兼容到borderType 为range的情况
		if (elem.rangeType === "range") {
			let border = borderConvert(elem.borderType, elem.style, elem.color);
			let rang = elem.range[0];
			let row = rang.row;
			let column = rang.column;
			for (let i = row[0] + 1; i < row[1] + 2; i++) {
				for (let y = column[0] + 1; y < column[1] + 2; y++) {
					worksheet.getCell(i, y).border = border;
				}
			}
		}
		if (elem.rangeType === "cell") {
			const { col_index, row_index } = elem.value;
			const borderData = Object.assign({}, elem.value);
			delete borderData.col_index;
			delete borderData.row_index;
			let border = addborderToCell(borderData, row_index, col_index);
			worksheet.getCell(row_index + 1, col_index + 1).border = border;
		}
		// worksheet.getCell(rang.row_focus + 1, rang.column_focus + 1).border = border
	});
}
function borderConvert(borderType, style = 1, color = "#000") {
	// 对应luckysheet的config中borderinfo的的参数
	if (!borderType) {
		return baseBorder;
	}
	const luckyToExcel = {
		type: {
			"border-all": "all",
			"border-top": "top",
			"border-right": "right",
			"border-bottom": "bottom",
			"border-left": "left",
		},
		style: {
			0: "none",
			1: "thin",
			2: "hair",
			3: "dotted",
			4: "dashDot", // 'Dashed',
			5: "dashDot",
			6: "dashDotDot",
			7: "double",
			8: "medium",
			9: "mediumDashed",
			10: "mediumDashDot",
			11: "mediumDashDotDot",
			12: "slantDashDot",
			13: "thick",
		},
	};
	let template = {
		style: luckyToExcel.style[style] || 'thin',
		color: { argb: color?.replace("#", "") || 'e6e6e6' },
	};
	let border = {};
	if (luckyToExcel.type[borderType] === "all") {
		border["top"] = template;
		border["right"] = template;
		border["bottom"] = template;
		border["left"] = template;
	} else {
		border[luckyToExcel.type[borderType]] = template;
	}
	return border;
}

function addborderToCell(borders, row_index, col_index) {
	let border = baseBorder;
	const luckyExcel = {
		type: {
			l: "left",
			r: "right",
			b: "bottom",
			t: "top",
		},
		style: {
			0: "none",
			1: "thin",
			2: "hair",
			3: "dotted",
			4: "dashDot", // 'Dashed',
			5: "dashDot",
			6: "dashDotDot",
			7: "double",
			8: "medium",
			9: "mediumDashed",
			10: "mediumDashDot",
			11: "mediumDashDotDot",
			12: "slantDashDot",
			13: "thick",
		},
	};

	for (const bor in borders) {
		if (borders[bor]?.color?.indexOf("rgb") === -1) {
			border[luckyExcel.type[bor]] = {
				style: luckyExcel.style[borders[bor].style] || 'thin',
				color: { argb: borders[bor].color?.replace("#", "") || 'e6e6e6' },
			};
		} else {
			border[luckyExcel.type[bor]] = {
				style: luckyExcel.style[borders[bor].style] || "thin",
				color: { argb: borders[bor].color || 'e6e6e6' },
			};
		}
	}

	return border;
}

function createCellPos(n) {
	let ordA = "A".charCodeAt(0);

	let ordZ = "Z".charCodeAt(0);
	let len = ordZ - ordA + 1;
	let s = "";
	while (n >= 0) {
		s = String.fromCharCode((n % len) + ordA) + s;

		n = Math.floor(n / len) - 1;
	}
	return s;
}

export { setStyleAndValue, setMerge, setBorder };

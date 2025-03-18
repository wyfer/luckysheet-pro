/**
 * 拓展 VChart 统计图
 *  1. vchart 官网： https://www.visactor.io/vchart/example
 *  2. vchart 的一些数据处理，需要借助 chartmix 工具类，相关地址： https://gitee.com/mengshukeji/chartMix
 */

import { seriesLoadScripts, loadLinks } from "../../utils/util";
import {
	generateRandomKey,
	replaceHtml,
	parseDataToPX,
} from "../../utils/chartUtil";
import chartInfo from "../../store";
import { getSheetIndex, getRangetxt } from "../../methods/get";
import { chart_selection } from "../chart/plugin";
import { setluckysheet_scroll_status } from "../../methods/set";
import { getdatabyselection, getcellvalue } from "../../global/getdata";
import { luckysheetMoveEndCell } from "../../controllers/sheetMove";
import { mouseposition } from "../../global/location";
import { getRangeSplitArray, getRowColCheck } from "../../utils/vchart";
import {
	vchartStyleContent,
	vchartTypeContent,
} from "../../controllers/constant";
import { deepCopy } from "../../utils/chartUtil";
import locale from "../../locale/locale";

/**
 * VChart 相关依赖及样式文件
 */
const dependScripts = ["expendPlugins/libs/vchart.min.js"];
const dependLinks = ["expendPlugins/vchart/vchart.css"];

/**
 * 注册 vchart
 * @param {*} data 整个 worker books data
 * @param {*} isDemo
 */
function vchart(data, isDemo) {
	// setTimeout(() => {
	//   openVChartSetting();
	// }, 100);

	// 加载 css
	loadLinks(dependLinks);

	// 加载 js 依赖
	seriesLoadScripts(dependScripts, null, () => {
		chartInfo.chart_selection = chart_selection();

		// Initialize the rendering vchart
		for (let i = 0; i < data.length; i++) {
			renderVCharts(data[i].vchart, isDemo);
		}

		for (let i = 0; i < data.length; i++) {
			if (data[i].status == "1") {
				renderChartShow(data[i].index);
			}
		}
	});
}

/**
 * 渲染图表 - 是初始化页面时，如果 sheet file vchart 有数据的话，应该调用 render 创建图表
 */
function renderVCharts(vchartList, isDemo) {
	// no chart
	if (vchartList == undefined) return;

	for (let i = 0; i < vchartList.length; i++) {
		let vchartItem = vchartList[i];

		let chart_id = vchartItem.chart_id;
		let chart_id_c = chart_id + "_c";

		let modelChartShowHTML =
			'<div id="${id}"class="luckysheet-modal-dialog luckysheet-modal-dialog-chart ${addclass}"tabindex="0"role="dialog"aria-labelledby=":41e"dir="ltr"><div class="luckysheet-modal-dialog-resize"><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lt"data-type="lt"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mt"data-type="mt"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lm"data-type="lm"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rm"data-type="rm"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rt"data-type="rt"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lb"data-type="lb"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mb"data-type="mb"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rb"data-type="rb"></div></div><div class="luckysheet-modal-dialog-controll"><span class="luckysheet-modal-controll-btn luckysheet-modal-controll-update"role="button"tabindex="0"aria-label="修改图表"title="修改图表"><i class="fa fa-pencil"aria-hidden="true"></i></span><span class="luckysheet-modal-controll-btn luckysheet-modal-controll-max"role="butluckysheet_chartIns_indexton"tabindex="0"aria-label="最大化"title="最大化"><i class="fa fa-window-maximize"aria-hidden="true"></i></span><span class="luckysheet-modal-controll-btn luckysheet-modal-controll-del"role="button"tabindex="0"aria-label="删除"title="删除"><i class="fa fa-trash"aria-hidden="true"></i></span></div><div class="luckysheet-modal-dialog-content">${content}</div></div>';

		let $t = $(
			replaceHtml(modelChartShowHTML, {
				id: chart_id_c,
				addclass: "luckysheet-data-visualization-chart",
				title: "图表生成",
				content: "",
			})
		).appendTo($(".luckysheet-cell-main"));

		// 设置移动效果
		setChartMoveableEffect($t);

		// 定义 VChart DOM
		const dom = $(`#${chart_id_c}`).children(
			".luckysheet-modal-dialog-content"
		)[0];

		dom.id = chart_id;

		let container = document.getElementById(chart_id_c);

		/**
		 * 核心方法 ： 创建 vchart 图表
		 * 定义 item ={ width:xxx; chart_id:xxx; chartOptions:{ spec:{...}; rangeArray:[] } }
		 * 后续的图表操作，需要基于创建对象 IVChart 及 ISpec 两个对象
		 * 包括修改图表配置等
		 */
		const vchart = new VChart.default(vchartItem.chartOptions.spec, {
			dom,
		});
		vchart.renderSync();

		//处理区域高亮框参数，当前页中，只有当前的图表的needRangShow为true,其他为false
		showNeedRangeShow(chart_id);

		// delete current chart
		$(`#${chart_id}_c .luckysheet-modal-controll-del`).click(function (e) {
			delVChart(chart_id);
		});

		// edit current chart
		$(`#${chart_id}_c .luckysheet-modal-controll-update`).click(function (
			e
		) {
			openVChartSetting(vchart);
		});

		// 实现点击图标高亮
		$t.children(".luckysheet-modal-dialog-content").mousedown(function (e) {
			if (!chartInfo.chartparam.luckysheetCurrentChartMaxState) {
				//当前图表显示区域高亮
				showNeedRangeShow(chart_id);
			}
			e.stopPropagation();
		});

		// move chart
		$t.mousedown(function (e) {
			if (!chartInfo.chartparam.luckysheetCurrentChartMaxState) {
				//当前图表显示区域高亮
				showNeedRangeShow(chart_id);
				setluckysheet_scroll_status(true);

				//允许拖动渲染框
				if (
					!$(e.target).is(".luckysheet-modal-dialog-controll") &&
					!$(e.target).is(".luckysheet-modal-controll-btn") &&
					!$(e.target).is("i")
				) {
					// Debounce
					chartInfo.chartparam.luckysheetCurrentChartMoveTimeout =
						setTimeout(function () {
							chartInfo.chartparam.luckysheetCurrentChartMove = true;
						}, 100);
				}

				var toffset =
					chartInfo.chartparam.luckysheetCurrentChartMoveObj.offset();
				var tpsition =
					chartInfo.chartparam.luckysheetCurrentChartMoveObj.position();
				//luckysheetCurrentChartMoveXy: [鼠标点相对chart框的距离X方向，鼠标点相对chart框的距离Y方向，chart框相对cell-main的距离X方向，chart框相对cell-main的距离Y方向，水平滚动条的位置，垂直滚动条的位置]
				chartInfo.chartparam.luckysheetCurrentChartMoveXy = [
					e.pageX - toffset.left,
					e.pageY - toffset.top,
					tpsition.left,
					tpsition.top,
					$("#luckysheet-scrollbar-x").scrollLeft(),
					$("#luckysheet-scrollbar-y").scrollTop(),
				];
				chartInfo.chartparam.luckysheetCurrentChartMoveWinH = $(
					"#luckysheet-cell-main"
				)[0].scrollHeight;
				chartInfo.chartparam.luckysheetCurrentChartMoveWinW = $(
					"#luckysheet-cell-main"
				)[0].scrollWidth;

				if (
					!$(e.target).hasClass("luckysheet-mousedown-cancel") &&
					$(e.target).filter("[class*='sp-palette']").length == 0 &&
					$(e.target).filter("[class*='sp-thumb']").length == 0 &&
					$(e.target).filter("[class*='sp-']").length == 0
				) {
					$("#luckysheet-rightclick-menu").hide();
					$("#luckysheet-cols-h-hover").hide();
					$("#luckysheet-cols-menu-btn").hide();
					$("#luckysheet-rightclick-menu").hide();
					$(
						"#luckysheet-sheet-list, #luckysheet-rightclick-sheet-menu, #luckysheet-user-menu"
					).hide();
					$(
						"body > .luckysheet-filter-menu, body > .luckysheet-filter-submenu, body > .luckysheet-cols-menu"
					).hide();
				}

				e.stopPropagation();
			}
		})
			// resize chart
			.find(".luckysheet-modal-dialog-resize-item")
			.mousedown(function (e) {
				if (chartInfo.chartparam.luckysheetCurrentChartActive) {
					chartInfo.chartparam.luckysheetCurrentChartResize =
						$(this).data("type"); //开始状态resize

					var mouse = mouseposition(e.pageX, e.pageY),
						scrollLeft = $("#luckysheet-scrollbar-x").scrollLeft(),
						scrollTop = $("#luckysheet-scrollbar-y").scrollTop();
					var x = mouse[0] + scrollLeft;
					var y = mouse[1] + scrollTop;
					var position =
						chartInfo.chartparam.luckysheetCurrentChartResizeObj.position();
					//参数：x,y:鼠标位置，$t.width(), $t.height(): chart框宽高， position.left + scrollLeft, position.top + scrollTop ：chart框位置 ，scrollLeft, scrollTop：滚动条位置
					chartInfo.chartparam.luckysheetCurrentChartResizeXy = [
						x,
						y,
						$t.width(),
						$t.height(),
						position.left + scrollLeft,
						position.top + scrollTop,
						scrollLeft,
						scrollTop,
					];
					chartInfo.chartparam.luckysheetCurrentChartResizeWinH = $(
						"#luckysheet-cell-main"
					)[0].scrollHeight;
					chartInfo.chartparam.luckysheetCurrentChartResizeWinW = $(
						"#luckysheet-cell-main"
					)[0].scrollWidth;

					chartInfo.chartparam.luckysheetCurrentChart = chart_id;

					e.stopPropagation();
				}
			});

		// 这里要兼容带单位的宽度和高度，不然会出现位置异常BUG
		let width = parseDataToPX(vchartItem.width);
		let height = parseDataToPX(vchartItem.height);
		let left = parseDataToPX(vchartItem.left);
		let top = parseDataToPX(vchartItem.top);

		container.style.width = width;
		container.style.height = height;
		container.style.position = "absolute";
		container.style.background = "#fff";
		container.style.left = left;
		container.style.top = top;
		container.style.zIndex = chartInfo.zIndex ? chartInfo.zIndex : 15;
		chartInfo.zIndex++;
	}
}

/**
 * 创建图表
 */
function createVChart(width, height, left, top) {
	// 获取用户选区
	var jfgird_select_save = luckysheet.getluckysheet_select_save();

	// 如果只选中一个选区，则直接返回
	if (
		jfgird_select_save.length == 1 &&
		jfgird_select_save[0].row[0] == jfgird_select_save[0].row[1] &&
		jfgird_select_save[0].column[0] == jfgird_select_save[0].column[1]
	)
		return;

	// ------------- start -------------
	var shiftpositon_row = -1;

	var row_ed =
		jfgird_select_save[0]["row"][1] - jfgird_select_save[0]["row"][0];

	// row getcellvalue
	for (
		var r = jfgird_select_save[0]["row"][0];
		r <= jfgird_select_save[0]["row"][1];
		r++
	) {
		for (
			var c = jfgird_select_save[0]["column"][0];
			c <= jfgird_select_save[0]["column"][1];
			c++
		) {
			var value = getcellvalue(r, c, luckysheet.flowdata());
			if (value != null && value.toString().length > 0) {
				shiftpositon_row = r;
				break;
			}
		}

		if (shiftpositon_row !== -1) {
			break;
		}
	}
	if (shiftpositon_row == -1) {
		shiftpositon_row = 0;
	}

	jfgird_select_save[0]["row"] = [shiftpositon_row, shiftpositon_row];
	jfgird_select_save[0].row_focus = shiftpositon_row;
	luckysheet.setluckysheet_select_save(jfgird_select_save);

	chartInfo.luckysheet_shiftpositon = $.extend(
		true,
		{},
		jfgird_select_save[0]
	);
	luckysheetMoveEndCell("down", "range", false, row_ed);
	jfgird_select_save = luckysheet.getluckysheet_select_save();

	// col getcellvalue

	var shiftpositon_col = -1;
	var column_ed =
		jfgird_select_save[0]["column"][1] - jfgird_select_save[0]["column"][0];

	for (
		var c = jfgird_select_save[0]["column"][0];
		c <= jfgird_select_save[0]["column"][1];
		c++
	) {
		for (
			var r = jfgird_select_save[0]["row"][0];
			r <= jfgird_select_save[0]["row"][1];
			r++
		) {
			var value = getcellvalue(r, c, luckysheet.flowdata());
			if (value != null && value.toString().length > 0) {
				shiftpositon_col = c;
				break;
			}
		}

		if (shiftpositon_col !== -1) {
			break;
		}
	}

	if (shiftpositon_col == -1) {
		shiftpositon_col = 0;
	}

	jfgird_select_save[0]["column"] = [shiftpositon_col, shiftpositon_col];
	jfgird_select_save[0].column_focus = shiftpositon_col;
	luckysheet.setluckysheet_select_save(jfgird_select_save);
	chartInfo.luckysheet_shiftpositon = $.extend(
		true,
		{},
		jfgird_select_save[0]
	);
	luckysheetMoveEndCell("right", "range", false, column_ed);
	jfgird_select_save = luckysheet.getluckysheet_select_save();

	//   获取 rangeArray、chartData
	var rangeArray = $.extend(true, [], jfgird_select_save);
	var rangeTxt = getRangetxt(
		chartInfo.currentSheetIndex,
		rangeArray[0],
		chartInfo.currentSheetIndex
	);
	let chartData = getdatabyselection();

	/**
	 * 数据处理完成，准备创建统计图
	 */
	let chart_id = generateRandomKey("chart");
	let chart_id_c = chart_id + "_c";
	let modelChartShowHTML =
		'<div id="${id}"class="luckysheet-modal-dialog luckysheet-modal-dialog-chart ${addclass}"tabindex="0"role="dialog"aria-labelledby=":41e"dir="ltr"><div class="luckysheet-modal-dialog-resize"><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lt"data-type="lt"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mt"data-type="mt"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lm"data-type="lm"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rm"data-type="rm"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rt"data-type="rt"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-lb"data-type="lb"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-mb"data-type="mb"></div><div class="luckysheet-modal-dialog-resize-item luckysheet-modal-dialog-resize-item-rb"data-type="rb"></div></div><div class="luckysheet-modal-dialog-controll"><span class="luckysheet-modal-controll-btn luckysheet-modal-controll-update"role="button"tabindex="0"aria-label="修改图表"title="修改图表"><i class="fa fa-pencil"aria-hidden="true"></i></span><span class="luckysheet-modal-controll-btn luckysheet-modal-controll-max"role="butluckysheet_chartIns_indexton"tabindex="0"aria-label="最大化"title="最大化"><i class="fa fa-window-maximize"aria-hidden="true"></i></span><span class="luckysheet-modal-controll-btn luckysheet-modal-controll-del"role="button"tabindex="0"aria-label="删除"title="删除"><i class="fa fa-trash"aria-hidden="true"></i></span></div><div class="luckysheet-modal-dialog-content">${content}</div></div>';

	let $t = $(
		replaceHtml(modelChartShowHTML, {
			id: chart_id_c,
			addclass: "luckysheet-data-visualization-chart",
			title: "图表生成",
			content: "",
		})
	).appendTo($(".luckysheet-cell-main"));

	// 定义 VChart DOM
	const dom = $(`#${chart_id_c}`).children(
		".luckysheet-modal-dialog-content"
	)[0];

	dom.id = chart_id;

	let container = document.getElementById(chart_id_c);

	/**
	 * ⛔️⛔️⛔️⛔️⛔️⛔️⛔️⛔️
	 *  图表中的 rangeSplitArray  rangeRowCheck  rangeColCheck 这三个数据项，均来之 chartmix.createChart() 方法中生成
	 *  会返回 { chart_json } 数据，内部包含了 三项重要的数据，用于处理高亮显示单元格
	 *  目前的处理方法是通过引用 chartmix 工具类，实现数据获取
	 * ⛔️⛔️⛔️⛔️⛔️⛔️⛔️⛔️
	 */

	const rowColCheck = getRowColCheck(chartData);
	const rangeRowCheck = rowColCheck[0];
	const rangeColCheck = rowColCheck[1];

	// 按照数据范围文字得到具体数据范围
	const rangeSplitArray = getRangeSplitArray(
		chartData,
		rangeArray,
		rangeColCheck,
		rangeRowCheck
	);

	// 获取 vchart 的配置项
	const spec = getVChartOption(rangeSplitArray);

	/**
	 * 合并配置项，生成 sheet file vchart 配置
	 * item ={ width:xxx; chart_id:xxx; chartOptions:{ spec:{...}; rangeArray:[] } }
	 */
	const chartOptions = {
		spec,
		rangeColCheck,
		rangeRowCheck,
		chart_id,
		rangeSplitArray,
		rangeArray,
		rangeTxt,
	};

	const vchart = new VChart.default(spec, { dom });
	vchart.renderSync();

	width = parseDataToPX(width || 400);
	height = parseDataToPX(height || 250);
	left = parseDataToPX(left || 0);
	top = parseDataToPX(top || 0);

	container.style.width = width;
	container.style.height = height;
	container.style.position = "absolute";
	container.style.background = "#fff";
	container.style.left = left;
	container.style.top = top;
	container.style.zIndex = chartInfo.zIndex ? chartInfo.zIndex : 15;
	chartInfo.zIndex++;

	// insert chartinfo
	let sheetFile =
		chartInfo.luckysheetfile[getSheetIndex(chartInfo.currentSheetIndex)];

	if (!sheetFile.vchart) {
		sheetFile.vchart = [];
	}
	sheetFile.vchart.push({
		chart_id,
		width,
		height,
		left,
		top,
		sheetIndex: sheetFile.index,
		chartOptions,
	});

	setChartMoveableEffect($t);

	// delete current chart
	$(`#${chart_id}_c .luckysheet-modal-controll-del`).click(function (e) {
		delVChart(chart_id);
	});

	// edit current chart
	$(`#${chart_id}_c .luckysheet-modal-controll-update`).click(function (e) {
		openVChartSetting(vchart);
	});

	// 实现点击图标高亮
	$t.children(".luckysheet-modal-dialog-content").mousedown(function (e) {
		if (!chartInfo.chartparam.luckysheetCurrentChartMaxState) {
			//当前图表显示区域高亮
			showNeedRangeShow(chart_id);
		}
		e.stopPropagation();
	});

	// move chart
	$t.mousedown(function (e) {
		if (!chartInfo.chartparam.luckysheetCurrentChartMaxState) {
			//当前图表显示区域高亮
			showNeedRangeShow(chart_id);
			setluckysheet_scroll_status(true);

			//允许拖动渲染框
			if (
				!$(e.target).is(".luckysheet-modal-dialog-controll") &&
				!$(e.target).is(".luckysheet-modal-controll-btn") &&
				!$(e.target).is("i")
			) {
				// Debounce
				chartInfo.chartparam.luckysheetCurrentChartMoveTimeout =
					setTimeout(function () {
						chartInfo.chartparam.luckysheetCurrentChartMove = true;
					}, 100);
			}

			var toffset =
				chartInfo.chartparam.luckysheetCurrentChartMoveObj.offset();
			var tpsition =
				chartInfo.chartparam.luckysheetCurrentChartMoveObj.position();
			//luckysheetCurrentChartMoveXy: [鼠标点相对chart框的距离X方向，鼠标点相对chart框的距离Y方向，chart框相对cell-main的距离X方向，chart框相对cell-main的距离Y方向，水平滚动条的位置，垂直滚动条的位置]
			chartInfo.chartparam.luckysheetCurrentChartMoveXy = [
				e.pageX - toffset.left,
				e.pageY - toffset.top,
				tpsition.left,
				tpsition.top,
				$("#luckysheet-scrollbar-x").scrollLeft(),
				$("#luckysheet-scrollbar-y").scrollTop(),
			];
			chartInfo.chartparam.luckysheetCurrentChartMoveWinH = $(
				"#luckysheet-cell-main"
			)[0].scrollHeight;
			chartInfo.chartparam.luckysheetCurrentChartMoveWinW = $(
				"#luckysheet-cell-main"
			)[0].scrollWidth;

			if (
				!$(e.target).hasClass("luckysheet-mousedown-cancel") &&
				$(e.target).filter("[class*='sp-palette']").length == 0 &&
				$(e.target).filter("[class*='sp-thumb']").length == 0 &&
				$(e.target).filter("[class*='sp-']").length == 0
			) {
				$("#luckysheet-rightclick-menu").hide();
				$("#luckysheet-cols-h-hover").hide();
				$("#luckysheet-cols-menu-btn").hide();
				$("#luckysheet-rightclick-menu").hide();
				$(
					"#luckysheet-sheet-list, #luckysheet-rightclick-sheet-menu, #luckysheet-user-menu"
				).hide();
				$(
					"body > .luckysheet-filter-menu, body > .luckysheet-filter-submenu, body > .luckysheet-cols-menu"
				).hide();
			}

			e.stopPropagation();
		}
	})
		// resize chart
		.find(".luckysheet-modal-dialog-resize-item")
		.mousedown(function (e) {
			if (chartInfo.chartparam.luckysheetCurrentChartActive) {
				chartInfo.chartparam.luckysheetCurrentChartResize =
					$(this).data("type"); //开始状态resize

				var mouse = mouseposition(e.pageX, e.pageY),
					scrollLeft = $("#luckysheet-scrollbar-x").scrollLeft(),
					scrollTop = $("#luckysheet-scrollbar-y").scrollTop();
				var x = mouse[0] + scrollLeft;
				var y = mouse[1] + scrollTop;
				var position =
					chartInfo.chartparam.luckysheetCurrentChartResizeObj.position();
				//参数：x,y:鼠标位置，$t.width(), $t.height(): chart框宽高， position.left + scrollLeft, position.top + scrollTop ：chart框位置 ，scrollLeft, scrollTop：滚动条位置
				chartInfo.chartparam.luckysheetCurrentChartResizeXy = [
					x,
					y,
					$t.width(),
					$t.height(),
					position.left + scrollLeft,
					position.top + scrollTop,
					scrollLeft,
					scrollTop,
				];
				chartInfo.chartparam.luckysheetCurrentChartResizeWinH = $(
					"#luckysheet-cell-main"
				)[0].scrollHeight;
				chartInfo.chartparam.luckysheetCurrentChartResizeWinW = $(
					"#luckysheet-cell-main"
				)[0].scrollWidth;

				chartInfo.chartparam.luckysheetCurrentChart = chart_id;

				e.stopPropagation();
			}
		});
}

/**
 * 删除图表
 */
function delVChart(chart_id) {
	// delete container
	$(`.luckysheet-cell-main #${chart_id}_c`).remove();

	// Hide selected range
	hideAllNeedRangeShow();

	// delete storage
	let sheetFile =
		chartInfo.luckysheetfile[getSheetIndex(chartInfo.currentSheetIndex)];

	let index = sheetFile.vchart.findIndex((item) => item.chart_id == chart_id);
	sheetFile.vchart.splice(index, 1);
}

// 隐藏其他sheet的图表，显示当前sheet的图表 chartMix 切换sheet页显示隐藏图表
function renderChartShow(index) {
	//传入index，图表显示隐藏
	selectRangeBorderHide("true"); //隐藏数据高亮区域，随意传入一个字符串，表示不处理chartSetting界面

	const luckysheetfile = chartInfo.luckysheetfile;
	luckysheetfile.forEach((file) => {
		//切换当前页的所有图表都显示出来
		if (file.index == index) {
			const chartLists = file.vchart || [];

			chartLists.forEach((vchart) => {
				vchart.isShow = true;
				$("#" + vchart.chart_id + "_c").show();

				if (vchart.needRangeShow == true) {
					//一个sheet页只有一个图表高亮显示,//重要！因为在store了做了存储，所以能在此处找到对应图表设置显示隐藏
					//操作DOM当前图表选择区域高亮
					selectRangeBorderShow(vchart.chart_id);
				}
			});
		}

		// 隐藏其他页的图表
		else {
			const chartLists = file.vchart || [];

			chartLists.forEach((vchart) => {
				vchart.isShow = false;
				$("#" + vchart.chart_id + "_c").hide();
			});
		}
	});
}

/**
 * ** 核心方法 **
 * 根据传入的 rangeArray 创建 VChart data 配置项
 */
function getVChartOption(rangeArray) {
	const { coltitle, rowtitle, content, range } = rangeArray;

	// 根据真实用户选取数据生成 data
	// 多个系列是通过 x 轴进行循环
	const options = {
		data: [{ id: "data", values: [] }],
		type: ["line", "bar"][Math.floor(Math.random() * 2)],
		xField: "key",
		yField: "value",
	};

	/**
	 * 下列所有的索引都是基于 range 的索引，因此，还需要处理索引
	 */
	if (rangeArray.type === "contentonly") {
	} else if (rangeArray.type === "topbottom") {
		// 上下数据结构，则 rowtitle 为x轴，content 即为y轴，也为值
		// 不需要判断，就是固定了 row 相同
		if (rowtitle && content) {
			// 1. 取行
			const rowtitle_row = rowtitle.row[0];
			const content_row = content.row[0];
			const len = rowtitle.column[1] - rowtitle.column[0];
			// 2. 循环
			for (let i = 0; i <= len; i++) {
				// 此时，需要处理轴线与值类型
				const xvalue = getcellvalue(
					range.row[0] + rowtitle_row,
					range.column[0] + i,
					luckysheet.flowdata()
				);
				const yvalue = getcellvalue(
					range.row[0] + content_row,
					range.column[0] + i,
					luckysheet.flowdata()
				);
				options.data[0].values.push({ key: xvalue, value: yvalue });
			}
		}
	} else if (rangeArray.type === "leftright") {
		// 左右数据结构，则 coltitle 为x轴，content 即为y轴，也为值
		if (coltitle && content) {
			// 1. 取列
			const coltitle_col = coltitle.column[0];
			const content_col = content.column[0];
			const len = coltitle.row[1] - coltitle.row[0];
			// 2. 循环
			for (let i = 0; i <= len; i++) {
				// 此时，需要处理轴线与值类型
				const xvalue = getcellvalue(
					range.row[0] + i,
					range.column[0] + coltitle_col,
					luckysheet.flowdata()
				);
				const yvalue = getcellvalue(
					range.row[0] + i,
					range.column[0] + content_col,
					luckysheet.flowdata()
				);
				options.data[0].values.push({ key: xvalue, value: yvalue });
			}
		}
	} else if (rangeArray.type === "normal") {
		// 定义数据项
		// 上下左右数据结构，则 rowtitle 为x轴，coltitle 为y轴，content 即为值
		const rowtitle_row = rowtitle.row[0];
		const coltitle_col = coltitle.column[0];

		// 使用数据集即可处理多系列问题
		// { type: 'Autocracies', year: '1930', value: 129 },
		// { type: 'Autocracies', year: '1940', value: 133 },
		const rclen = rowtitle.column[1] - rowtitle.column[0];
		const cclen = coltitle.row[1] - coltitle.row[0];
		for (let i = 1; i <= rclen + 1; i++) {
			// 0-7 此时可以确认 Mon	Tues	Wed	    Thur	Fri	Sat	Sun
			// 此时可以唯一确定 type year value 三个值

			// 1. xAxis 固定 col = coltitle_col
			const xAxis = getcellvalue(
				range.row[0] + rowtitle_row,
				range.column[0] + i,
				luckysheet.flowdata()
			);
			for (let j = 1; j <= cclen + 1; j++) {
				// 循环列
				// 2. series 固定 row = rowtitle_row
				const series = getcellvalue(
					range.row[0] + j,
					range.column[0] + coltitle_col,
					luckysheet.flowdata()
				);
				// 3. value
				const value = getcellvalue(
					range.row[0] + j,
					range.column[0] + i,
					luckysheet.flowdata()
				);
				options.data[0].values.push({ xAxis, series, value });
			}
		}
		// 声明 x 轴字段，当存在分组时
		options.xField = ["series", "xAxis"];
		// 声明 y 轴字段
		options.yField = "value";
		// 用于颜色映射
		options.seriesField = "xAxis";
	}

	return options;
}

/**
 * 设置图表可拖动区域高亮效果，鼠标经过可拖动区域时鼠标显示“十字”，不可拖动区域显示箭头
 */
function setChartMoveableEffect($container) {
	$container.find(".luckysheet-modal-dialog-content").hover(
		function () {
			$container.removeClass("chart-moveable");
		},
		function () {
			$container.addClass("chart-moveable");
		}
	);

	$container.hover(
		function () {
			$container.addClass("chart-moveable");
		},
		function () {
			$container.removeClass("chart-moveable");
		}
	);
}

/**
 * 设置某个图表的高亮区域状态为显示,处理当前页的所有图表，只取一个图表设置为显示，其他隐藏，其他页不管
 */
function showNeedRangeShow(chart_id) {
	let chartLists =
		chartInfo.luckysheetfile[getSheetIndex(chartInfo.currentSheetIndex)]
			.vchart;
	for (let chartId in chartLists) {
		//当前sheet的图表先设置为false
		chartLists[chartId].needRangeShow = false;
		if (chartLists[chartId].chart_id == chart_id) {
			chartLists[chartId].needRangeShow = true;
			const vchart = chartLists.find((i) => i.chart_id === chart_id);
			chartInfo.currentChart = vchart.chartOptions;
		}
	}

	//操作DOM当前图表选择区域高亮
	selectRangeBorderShow(chart_id);
}

/**
 * 操作DOM当前图表选择区域高亮
 */
function selectRangeBorderShow(chart_id) {
	let $t = $("#" + chart_id + "_c");
	// TODO: 高亮数据区域
	// Highlight of data range
	chartInfo.chart_selection.create();

	chartInfo.chartparam.luckysheetCurrentChartActive = true;
	chartInfo.chartparam.luckysheetCurrentChartMoveObj = $t;
	chartInfo.chartparam.luckysheetCurrentChartResizeObj = $t;
	chartInfo.chartparam.luckysheetCurrentChart = chart_id;

	//luckysheet取cell-main，后续扩展到其他的用户自定义元素
	$("#luckysheet-cell-main")
		.find(".luckysheet-modal-dialog-chart .luckysheet-modal-dialog-resize")
		.hide();
	$("#luckysheet-cell-main")
		.find(
			".luckysheet-modal-dialog-chart .luckysheet-modal-dialog-controll"
		)
		.hide();

	$t.css("z-index", chartInfo.chartparam.luckysheetCurrentChartZIndexRank++);
	$t.find(".luckysheet-modal-dialog-resize").show();
	$t.find(".luckysheet-modal-dialog-controll").show();

	if (
		($(".chartSetting").is(":visible") ||
			chartInfo.chartparam.luckysheet_chart_redo_click) &&
		chart_id != chartInfo.chartparam.luckysheetCurrentChart
	) {
		// TODO: 第一次创建图表时候需要初始化数据选择框 qkSelection
		// generator.ini(chartMixConfig)
		$("body .luckysheet-cols-menu").hide();
	}
}

/**
 * 隐藏当前sheet所有的图表高亮区域
 */
function hideAllNeedRangeShow() {
	let chartLists =
		chartInfo.luckysheetfile[getSheetIndex(chartInfo.currentSheetIndex)]
			.vchart;
	for (let chartId in chartLists) {
		//当前sheet的图表设置为false
		chartLists[chartId].needRangeShow = false;
	}

	//操作DOM 当前图表选择区域隐藏
	selectRangeBorderHide();
}

/**
 * 选择区域高亮隐藏
 */
function selectRangeBorderHide() {
	$(
		"#luckysheet-cell-main .luckysheet-modal-dialog-chart .luckysheet-modal-dialog-resize, #luckysheet-cell-main .luckysheet-modal-dialog-chart .luckysheet-modal-dialog-controll"
	).hide();
	$("#luckysheet-cell-main")
		.find(".luckysheet-datavisual-selection-set div")
		.remove();
	chartInfo.chartparam.luckysheetCurrentChartActive = false;

	$("#luckysheet-chart-rangeShow").empty();
}

/**
 * 打开VChart属性面板
 * @param { IVChart } vchart
 */
function openVChartSetting(vchart) {
	const baseOption = vchart ? deepCopy(vchart.getChart()._spec) : {};

	// 删除影响渲染的其他属性
	delete baseOption.series;
	delete baseOption.region;
	delete baseOption.crosshair;
	delete baseOption.axes;

	// 1. 打开蒙版
	const $dialogMask = $("#luckysheet-modal-dialog-mask");
	$dialogMask.show();
	$dialogMask.css("background", "rgba(0, 0, 0, 0.15)");

	// 2. 判断 dialog 是否存在
	let $dialog = $("#luckysheet-vchart-setting-dialog");

	if ($dialog.length) $($dialog).show();
	else {
		$dialog = $(
			replaceHtml("<div id='luckysheet-vchart-setting-dialog'></div>")
		).appendTo($("body"));
	}

	// 创建 setting dialog、 setting dialog body 内容html
	const $content =
		'<div class="luckysheet-vchart-setting-dialog-title"><span class="title">${title}</span><span id="luckysheet-vchart-setting-dialog-close" title="${close}"><i class="fa fa-close" aria-hidden="true"></i></span></div><div class="luckysheet-vchart-setting-dialog-body">${body}</div><div class="luckysheet-vchart-setting-dialog-footer"><span class="cancel">${cancel}</span><span class="confirm">${confirm}</span></div>';
	const bodyContent =
		'<div class="luckysheet-vchart-setting-dialog-body-tabs"><span class="tab active">${type}</span><span class="tab">${style}</span></div><div class="luckysheet-vchart-setting-dialog-body-content" id="type">${typeContent}</div><div class="luckysheet-vchart-setting-dialog-body-content" id="style" style="display:none;">${styleContent}</div>';

	// 初始化
	$($dialog).html(
		replaceHtml($content, {
			title: locale().vChart.title,
			close: locale().vChart.close,
			cancel: locale().vChart.cancel,
			confirm: locale().vChart.confirm,
			body: replaceHtml(bodyContent, {
				type: locale().vChart.type,
				style: locale().vChart.style,
				typeContent: vchartTypeContent,
				styleContent: vchartStyleContent,
			}),
		})
	);

	/**
	 * 下列代码测试用
	 */
	// $("#type").hide();
	// $("#style").show();

	// 实现 tab 切换
	$(".luckysheet-vchart-setting-dialog-body").on(
		"click",
		".tab",
		function () {
			const index = $(this).index();

			$(".tab").removeClass("active");
			$(this).addClass("active");

			$(".luckysheet-vchart-setting-dialog-body-content").hide();
			$(".luckysheet-vchart-setting-dialog-body-content")
				.eq(index)
				.show();
		}
	);

	let spec = null;

	/**
	 * VChart 配置更新 - 具体内容区的各种事件
	 *  1. 类型事件 - 基于 baseOptions 做调整
	 *  TODO: 待优化
	 */
	$(".vchart-type-item")
		.off("click")
		.on("click", function () {
			// 1. 获取当前图表类型
			const type = $(this).attr("data-type");
			console.log("==> 当前点击的图表类型", type);

			// updateSpec 是 spec 更新，而不是数据替换
			switch (type) {
				case "basic-line":
					spec = Object.assign(baseOption, {
						type: "line",
						line: { style: { curveType: "none" } },
					});
					break;
				case "smoothed-line":
					spec = Object.assign(baseOption, {
						type: "line",
						line: { style: { curveType: "monotone" } },
					});
					break;
				case "step-line":
					spec = Object.assign(baseOption, {
						type: "line",
						line: { style: { curveType: "stepAfter" } },
					});
					break;
				case "basic-area":
					spec = Object.assign(baseOption, {
						type: "area",
						line: { style: { curveType: "none" } },
					});
					break;
				case "smoothed-area":
					spec = Object.assign(baseOption, {
						type: "area",
						line: { style: { curveType: "monotone" } },
					});
					break;
				case "step-area":
					spec = Object.assign(baseOption, {
						type: "area",
						line: { style: { curveType: "stepAfter" } },
					});
					break;
				case "basic-column":
					spec = Object.assign(baseOption, {
						type: "bar",
					});
					break;
				case "basic-pie":
					spec = Object.assign(baseOption, {
						type: "pie",
						outerRadius: 0.8,
						innerRadius: 0,
						padAngle: 0,
						valueField: "value",
						categoryField: "key",
						pie: {
							style: {
								cornerRadius: 0,
							},
							state: {
								hover: {
									outerRadius: 0.85,
									lineWidth: 1,
								},
								selected: {
									outerRadius: 0.85,
									lineWidth: 1,
								},
							},
						},
					});
					break;
				case "ring-pie":
					spec = Object.assign(baseOption, {
						type: "pie",
						valueField: "value",
						categoryField: "key",
						outerRadius: 0.8,
						innerRadius: 0.5,
						padAngle: 0.6,
						pie: {
							style: {
								cornerRadius: 10,
							},
							state: {
								hover: {
									outerRadius: 0.85,
									lineWidth: 1,
								},
								selected: {
									outerRadius: 0.85,
									lineWidth: 1,
								},
							},
						},
					});
					console.log("==> spec", spec);
					break;
			}
			vchart.updateSpec(spec);
		});

	// 标题 - 目前使用 input 事件，可以考虑使用 blur
	$("#vchart-setting-title")
		.off("input")
		.on("input", function () {
			const text = $(this)[0].value;

			spec = Object.assign(baseOption, {
				title: {
					visible: true,
					text,
				},
			});
			vchart.updateSpec(spec);
		});

	// 监听close 事件
	$("#luckysheet-vchart-setting-dialog-close")
		.off("click")
		.on("click", () => closeVChartSetting(spec));

	// 监听取消事件
	$(".luckysheet-vchart-setting-dialog-footer .cancel")
		.off("click")
		.on("click", () => closeVChartSetting(spec));

	// 监听确认事件
	$(".luckysheet-vchart-setting-dialog-footer .confirm")
		.off("click")
		.on("click", () => closeVChartSetting(spec));

	// 监听蒙版点击事件
	$($dialogMask)
		.off("click")
		.on("click", () => closeVChartSetting(spec));
}

/**
 * 关闭属性面板
 */
function closeVChartSetting(spec) {
	const $dialogMask = $("#luckysheet-modal-dialog-mask");
	const $dialog = $("#luckysheet-vchart-setting-dialog");

	$dialogMask.css("background", "#fff");

	$dialogMask.hide();
	$dialog.hide();

	// 如果是null 则表示当前setting 用户没有执行任何操作
	if (!spec) return;

	console.group("图表更新");
	console.log("==> 更新后的配置", spec);
	console.groupEnd();
}

export { vchart, createVChart, renderVCharts };

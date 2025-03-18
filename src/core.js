import defaultSetting from "./config.js";
import { common_extend, replaceHtml } from "./utils/util";
import Store from "./store";
import { locales } from "./locale/locale";
import server from "./controllers/server";
import luckysheetConfigsetting from "./controllers/luckysheetConfigsetting";
import sheetmanage from "./controllers/sheetmanage";
import luckysheetsizeauto from "./controllers/resize";
import luckysheetHandler from "./controllers/handler";
import { initialFilterHandler } from "./controllers/filter";
import { initialMatrixOperation } from "./controllers/matrixOperation";
import { initialSheetBar } from "./controllers/sheetBar";
import { formulaBarInitial } from "./controllers/formulaBar";
import { rowColumnOperationInitial } from "./controllers/rowColumnOperation";
import { keyboardInitial } from "./controllers/keyboard";
import { orderByInitial } from "./controllers/orderBy";
import { initPlugins } from "./controllers/expendPlugins";
import {
	getluckysheetfile,
	getluckysheet_select_save,
	getconfig,
} from "./methods/get";
import { setluckysheet_select_save } from "./methods/set";
import { luckysheetrefreshgrid, jfrefreshgrid } from "./global/refresh";
import functionlist from "./function/functionlist";
import { luckysheetlodingHTML } from "./controllers/constant";
import { getcellvalue, getdatabyselection } from "./global/getdata";
import { setcellvalue } from "./global/setdata";
import { selectHightlightShow } from "./controllers/select";
import { zoomInitial } from "./controllers/zoom";
import { printInitial } from "./controllers/print";
import method from "./global/method";

import * as api from "./global/api";

import flatpickr from "flatpickr";
import Mandarin from "flatpickr/dist/l10n/zh.js";
import { initListener } from "./controllers/listener";
import { hideloading, showloading, setloadingcolor } from "./global/loading.js";
import { luckysheetextendData } from "./global/extend.js";
import {
	superFormulaCompute,
	superFormulaScript,
} from "./controllers/superFormula";
import {
	fileDecryption,
	fileEncryption,
	fileImport,
	importFile,
	getExportData,
	clearSheets,
} from "./controllers/fileMenu.js";

let luckysheet = {};

luckysheet = common_extend(api, luckysheet);

//创建luckysheet表格
luckysheet.create = function (setting) {
	method.destroy();
	// Store original parameters for api: toJson
	Store.toJsonOptions = {};
	for (let c in setting) {
		if (c !== "data") {
			Store.toJsonOptions[c] = setting[c];
		}
	}

	let extendsetting = common_extend(defaultSetting, setting);

	let loadurl = extendsetting.loadUrl,
		menu = extendsetting.menu,
		title = extendsetting.title;

	let container = extendsetting.container;
	Store.container = container;
	Store.luckysheetfile = extendsetting.data;
	Store.defaultcolumnNum = extendsetting.column;
	Store.defaultrowNum = extendsetting.row;
	Store.defaultFontSize = extendsetting.defaultFontSize;
	Store.fullscreenmode = extendsetting.fullscreenmode;
	Store.lang = extendsetting.lang; //language
	Store.allowEdit = extendsetting.allowEdit;
	Store.limitSheetNameLength = extendsetting.limitSheetNameLength;
	Store.defaultSheetNameMaxLength = extendsetting.defaultSheetNameMaxLength;
	Store.fontList = extendsetting.fontList;
	server.gridKey = extendsetting.gridKey;
	server.loadUrl = extendsetting.loadUrl;
	server.updateUrl = extendsetting.updateUrl;
	server.updateImageUrl = extendsetting.updateImageUrl;
	server.title = extendsetting.title;
	server.loadSheetUrl = extendsetting.loadSheetUrl;
	server.allowUpdate = extendsetting.allowUpdate;

	luckysheetConfigsetting.autoFormatw = extendsetting.autoFormatw;
	luckysheetConfigsetting.accuracy = extendsetting.accuracy;
	luckysheetConfigsetting.total = extendsetting.data[0].total;

	luckysheetConfigsetting.loading = extendsetting.loading;
	luckysheetConfigsetting.allowCopy = extendsetting.allowCopy;
	luckysheetConfigsetting.showtoolbar = extendsetting.showtoolbar;
	luckysheetConfigsetting.showtoolbarConfig = extendsetting.showtoolbarConfig;
	luckysheetConfigsetting.showinfobar = extendsetting.showinfobar;
	luckysheetConfigsetting.showsheetbar = extendsetting.showsheetbar;
	luckysheetConfigsetting.showsheetbarConfig =
		extendsetting.showsheetbarConfig;
	luckysheetConfigsetting.showstatisticBar = extendsetting.showstatisticBar;
	luckysheetConfigsetting.showstatisticBarConfig =
		extendsetting.showstatisticBarConfig;
	luckysheetConfigsetting.sheetFormulaBar = extendsetting.sheetFormulaBar;
	luckysheetConfigsetting.cellRightClickConfig =
		extendsetting.cellRightClickConfig;
	luckysheetConfigsetting.sheetRightClickConfig =
		extendsetting.sheetRightClickConfig;
	luckysheetConfigsetting.pointEdit = extendsetting.pointEdit;
	luckysheetConfigsetting.pointEditUpdate = extendsetting.pointEditUpdate;
	luckysheetConfigsetting.pointEditZoom = extendsetting.pointEditZoom;

	luckysheetConfigsetting.userInfo = extendsetting.userInfo;
	luckysheetConfigsetting.userMenuItem = extendsetting.userMenuItem;
	luckysheetConfigsetting.myFolderUrl = extendsetting.myFolderUrl;
	luckysheetConfigsetting.functionButton = extendsetting.functionButton;

	luckysheetConfigsetting.showConfigWindowResize =
		extendsetting.showConfigWindowResize;
	luckysheetConfigsetting.enableAddRow = extendsetting.enableAddRow;
	luckysheetConfigsetting.enableAddBackTop = extendsetting.enableAddBackTop;
	luckysheetConfigsetting.addRowCount = extendsetting.addRowCount;
	luckysheetConfigsetting.enablePage = extendsetting.enablePage;
	luckysheetConfigsetting.pageInfo = extendsetting.pageInfo;

	luckysheetConfigsetting.editMode = extendsetting.editMode;
	luckysheetConfigsetting.beforeCreateDom = extendsetting.beforeCreateDom;
	luckysheetConfigsetting.workbookCreateBefore =
		extendsetting.workbookCreateBefore;
	luckysheetConfigsetting.workbookCreateAfter =
		extendsetting.workbookCreateAfter;
	luckysheetConfigsetting.remoteFunction = extendsetting.remoteFunction;
	luckysheetConfigsetting.customFunctions = extendsetting.customFunctions;

	luckysheetConfigsetting.fireMousedown = extendsetting.fireMousedown;
	luckysheetConfigsetting.forceCalculation = extendsetting.forceCalculation;
	luckysheetConfigsetting.plugins = extendsetting.plugins;

	luckysheetConfigsetting.rowHeaderWidth = extendsetting.rowHeaderWidth;
	luckysheetConfigsetting.columnHeaderHeight =
		extendsetting.columnHeaderHeight;

	luckysheetConfigsetting.defaultColWidth = extendsetting.defaultColWidth;
	luckysheetConfigsetting.defaultRowHeight = extendsetting.defaultRowHeight;

	luckysheetConfigsetting.title = extendsetting.title;
	luckysheetConfigsetting.container = extendsetting.container;
	luckysheetConfigsetting.hook = extendsetting.hook;

	// 菜单功能用户注册事件
	luckysheetConfigsetting.menuHandler = extendsetting.menuHandler;

	luckysheetConfigsetting.pager = extendsetting.pager;

	luckysheetConfigsetting.initShowsheetbarConfig = false;

	luckysheetConfigsetting.imageUpdateMethodConfig =
		extendsetting.imageUpdateMethodConfig;

	if (Store.lang === "zh") flatpickr.localize(Mandarin.zh);

	// Store the currently used plugins for monitoring asynchronous loading
	Store.asyncLoad.push(...luckysheetConfigsetting.plugins);

	// // Register plugins
	// initPlugins(extendsetting.plugins, extendsetting.data);

	// Store formula information, including internationalization
	functionlist(extendsetting.customFunctions);

	let devicePixelRatio = extendsetting.devicePixelRatio;
	if (devicePixelRatio == null) {
		devicePixelRatio = 1;
	}
	Store.devicePixelRatio = Math.ceil(devicePixelRatio);

	//loading
	// const loadingObj = luckysheetlodingHTML("#" + container);
	// Store.loadingObj = loadingObj;

	/**
	 * 处理加密逻辑
	 */
	if (
		luckysheetConfigsetting &&
		luckysheetConfigsetting.menuHandler &&
		luckysheetConfigsetting.menuHandler.openDocumentPassword &&
		typeof luckysheetConfigsetting.menuHandler.openDocumentPassword ==
			"function"
	) {
		// 1. 隐藏 loading
		// loadingObj.close();
		// 2. 显示密码输入弹窗
		const $mask =
			'<div class="luckysheet-encrypt-mask"><div class="luckysheet-encrypt-content"><div class="luckysheet-encrypt-content-title"> <span class="title">${title}</span><span class="close" id="close" title="${close}"><i class="fa fa-close" aria-hidden="true"></i></span></div><div class="luckysheet-encrypt-tips">${tips}</div><div class="luckysheet-encrypt-content-input"><i class="fa fa-lock" aria-hidden="true" /></i><input type="password" id="luckysheet-encrypt-input" aotucomplete="off" placeholder="${placeholder}"></input></div><div class="luckysheet-encrypt-content-result"></div><div class="luckysheet-encrypt-content-footer"><span class="cancel">${cancel}</span><span class="confirm">${confirm}</span></div></div></div>';

		const target = "#" + container;
		$(target).append(
			replaceHtml($mask, {
				title: "文档已加密",
				close: "关闭",
				tips: "此文档为加密文档，请输入文档打开密码:",
				placeholder: "请输入文档密码",
				cancel: "取消",
				confirm: "确认",
			})
		);

		// 在输入过程中，清空 result 结果提示
		$("#luckysheet-encrypt-input").on("input", () => {
			$(".luckysheet-encrypt-content-result").text("");
		});

		// 注册关闭事件
		$(".luckysheet-encrypt-content-footer .cancel").click(() => {
			$(".luckysheet-encrypt-mask").remove();
		});
		$("#close").click(() => {
			$(".luckysheet-encrypt-mask").remove();
		});

		// 注册确认按钮
		$(".luckysheet-encrypt-content-footer .confirm").click(() => {
			const value =
				luckysheetConfigsetting.menuHandler.openDocumentPassword(
					$("#luckysheet-encrypt-input").val()
				);
			if (!value) {
				// 密码错误
				$(".luckysheet-encrypt-content-result").text("⛔️ 密码错误!");
				$("#luckysheet-encrypt-input").val("");
			} else {
				// loadingObj.show();
				luckysheetHandler();
			}
		});
	} else luckysheetHandler();

	/**
	 * 执行后续的 luckysheet 初始化工作
	 */
	function luckysheetHandler() {
		if (loadurl == "") {
			initPlugins(extendsetting.plugins, extendsetting.data);
			sheetmanage.initialjfFile(menu, title);
			// luckysheetsizeauto();
			initialWorkBook();
		} else {
			$.post(loadurl, { gridKey: server.gridKey }, function (d) {
				let data = new Function("return " + d)();
				Store.luckysheetfile = data;
				// 协同请求到数据后，再执行 init plugin
				initPlugins(extendsetting.plugins, data);

				sheetmanage.initialjfFile(menu, title);
				// luckysheetsizeauto();
				initialWorkBook();

				//需要更新数据给后台时，建立WebSocket连接
				if (server.allowUpdate) {
					server.openWebSocket();
				}
			}).error((error) => {
				// 向上暴露错误 error 不能阻塞渲染
				console.error("协同服务异常，请检查后重试！", error);
				// loadingObj.close();
				sheetmanage.initialjfFile(menu, title);
				// luckysheetsizeauto();
				initialWorkBook();
				showloading("协同服务异常，请检查后重试！");
				setloadingcolor("#F56C6C");
			});
		}
	}
};

function initialWorkBook() {
	luckysheetHandler(); //Overall dom initialization
	initialFilterHandler(); //Filter initialization
	initialMatrixOperation(); //Right click matrix initialization
	initialSheetBar(); //bottom sheet bar initialization
	formulaBarInitial(); //top formula bar initialization
	rowColumnOperationInitial(); //row and coloumn operate initialization
	keyboardInitial(); //Keyboard operate initialization
	orderByInitial(); //menu bar orderby function initialization
	zoomInitial(); //zoom method initialization
	printInitial(); //print initialization
	initListener();
	// demoTest();
}

//获取所有表格数据
luckysheet.getluckysheetfile = getluckysheetfile;

//获取当前表格 选区
luckysheet.getluckysheet_select_save = getluckysheet_select_save;

//设置当前表格 选区
luckysheet.setluckysheet_select_save = setluckysheet_select_save;

//获取当前表格 config配置
luckysheet.getconfig = getconfig;

//二维数组数据 转化成 {r, c, v}格式 一维数组 (传入参数为二维数据data)
luckysheet.getGridData = sheetmanage.getGridData;

//生成表格所需二维数组 （传入参数为表格数据对象file）
luckysheet.buildGridData = sheetmanage.buildGridData;

// Refresh the canvas display data according to scrollHeight and scrollWidth
luckysheet.luckysheetrefreshgrid = luckysheetrefreshgrid;

// Refresh canvas
luckysheet.jfrefreshgrid = jfrefreshgrid;

// Get the value of the cell
luckysheet.getcellvalue = getcellvalue;

// Set cell value
luckysheet.setcellvalue = setcellvalue;

// Get selection range value
luckysheet.getdatabyselection = getdatabyselection;

luckysheet.sheetmanage = sheetmanage;

// Data of the current table
luckysheet.flowdata = function () {
	return Store.flowdata;
};

// Set selection highlight
luckysheet.selectHightlightShow = selectHightlightShow;

// Reset parameters after destroying the table
luckysheet.destroy = method.destroy;

luckysheet.showLoadingProgress = showloading;
luckysheet.hideLoadingProgress = hideloading;
luckysheet.luckysheetextendData = luckysheetextendData;

luckysheet.locales = locales;

luckysheet.importFile = importFile;
luckysheet.getExportData = getExportData;
luckysheet.clearSheets = clearSheets;

export { luckysheet };

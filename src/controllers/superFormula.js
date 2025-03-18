/**
 * 超级公式相关实现逻辑
 *  1. 公用一个弹窗
 *  2. 还需要进行选区操作，因此不再适用蒙版关闭方案，需要直接式提供按钮实现
 */
import locale from "../locale/locale";
import luckysheetPostil from "./postil";
import menuButton from "./menuButton";
import {
	replaceHtml,
	mouseclickposition,
	luckysheetContainerFocus,
} from "../utils/util";
import functionImplementation from "../function/functionImplementation";
import getLocalizedFunctionList from "../function/getLocalizedFunctionList";
import Store from "../store";
import { seriesLoadScripts, loadLinks } from "../utils/util";

function superFormulaCompute() {
	openDialog("compute");
}
function superFormulaDateDiff() {
	openDialog("dateDiff");
}
function superFormulaRanking() {
	openDialog("ranking");
}
function superFormulaIdInfo() {
	openDialog("idInfo");
}
function superFormulaScript() {
	openDialog("script");
}
function superFormulaLatex() {
	openDialog("latex");
}

/**
 * 公共函数
 */
function openDialog(type) {
	let $dialog = $("#luckysheet-superformula-dialog");
	if ($dialog.length) {
		$dialog.show();
	} else {
		$dialog = $(
			replaceHtml("<div id='luckysheet-superformula-dialog'></div>")
		).appendTo($("body"));
	}

	// 头部提供下拉菜单，快捷切换公式
	const $content =
		'<div class="luckysheet-superformula-dialog-header"> <span class="title">${title} <i class="iconfont luckysheet-iconfont-xiayige"style="user-select: none;" /></span> <span class="close" title="关闭"><i class="fa fa-close" aria-hidden="true"></i></span></div><div class="luckysheet-superformula-dialog-content"><div class="describe"><span class="tips">功能说明</span><span class="text">${describe}</span></div><div class="example"><span class="tips">使用样例</span>${example}</div><div class="luckysheet-menuseparator luckysheet-mousedown-cancel" role="separator"></div><div class="content">${content}</div></div><div class="luckysheet-superformula-dialog-footer"><span class="confirm">${confirm}</span></div>';
	// 初始化内容
	$($dialog).html(
		replaceHtml($content, {
			...getTypeInfo(type),
			cancel: locale().vChart.cancel,
			confirm: locale().vChart.confirm,
		})
	);

	// 初始化内容实现事件 - 实现算术计算、日期差 的核心算法
	initTypeEvent(type);

	// 实现标题点击出现下拉菜单
	$dialog
		.find(".luckysheet-superformula-dialog-header .title")
		.click(openSubMenu);

	// 监听 close confirm 事件
	$dialog
		.find(".luckysheet-superformula-dialog-header .close")
		.click(closeDialog);
	$dialog
		.find(".luckysheet-superformula-dialog-footer .cancel")
		.click(closeDialog);
	$dialog
		.find(".luckysheet-superformula-dialog-footer .confirm")
		.click(closeDialog);
}
function closeDialog() {
	let $dialog = $("#luckysheet-superformula-dialog");
	$dialog.hide();
}

// 根据传入的类型，获取其 title 及内容区 hml
function getTypeInfo(type) {
	const map = {
		compute: {
			title: locale().superFormula.compute,
			content: `
			<div class="content-item">
				<div class="label">文本算式:</div>
				<input id="input" placeholder="请输入单元格,例如: B1 | B1:B4 " autocomplete="off" />
			</div>
			<div class="content-item" style="align-items: flex-start;">
				<div class="label">输出位置:</div>
				<div style="flex:auto">
					<div style="display:flex;align-items: center;"><input style="flex:none" type="radio" id="newcol" name="output" value="newcol" checked> <label for="newcol">原位置后插入新列</label></div>
					<div style="display:flex;align-items: center;"><input style="flex:none" type="radio" id="cover" name="output" value="cover"> <label for="cover">原位置覆盖</label></div>
					<div style="display:flex;align-items: center;"><input style="flex:none" type="radio" id="custom" name="output" value="custom"><label for="custom">自定义单元格输出</label></div>
					<input style="width:100%;display:none" type="text" id="custom" placeholder="请输入单元格,例如: B1 | B1:B4 " autocomplete="off" />
				</div>
			</div>`,
			describe:
				"快速计算出单元格文本算式的结果，如：单元格中输入：3*3+4，则计算结果为：13。",
			example: "<img src='../assets/superFormula/compute.png' />",
		},
		dateDiff: {
			title: locale().superFormula.dateDiff,
			content: "dateDiff",
			describe: "",
			example: "<img src='../assets/superFormula/compute.png' />",
		},
		ranking: {
			title: locale().superFormula.ranking,
			content: "ranking",
			describe: "",
			example: "<img src='../assets/superFormula/compute.png' />",
		},
		idInfo: {
			title: locale().superFormula.idInfo,
			content: "idInfo",
			describe: "",
			example: "<img src='../assets/superFormula/compute.png' />",
		},
		script: {
			title: locale().superFormula.script,
			content: `
			<div class="content-item">
				<div class="label">数据单元格:</div>
				<input placeholder="请输入单元格,例如: B1 | B1:B4 " autocomplete="off" />
			</div>
			<div id='editor' class='hljs language-js'></div>`,
			describe:
				"自定义脚本实现数据处理，例如：获取用户信息，计算用户年龄，返回年龄。",
			example: "",
		},
		latex: {
			title: locale().superFormula.latex,
			content: "latex",
			describe: "",
			example: "<img src='../assets/superFormula/compute.png' />",
		},
	};

	return map[type] || { title: "未找到标题", content: "未找到内容" };
}

/**
 * initTypeEvent 实现核心算法
 * @param {*} type
 */
function initTypeEvent(type) {
	// 根据类型执行不同的事件
	const eventMap = {
		compute: initComputeHandle,
		dateDiff: initDateDiffHandle,
		ranking: initRankingHandle,
		idInfo: initIdInfoHandle,
		script: initScriptHandle,
		latex: initLatexHandle,
	};
	eventMap[type]();
}
// 算术计算
function initComputeHandle() {
	// 1. 初始化单选事件
	$(".luckysheet-superformula-dialog-content input[type='radio']").click(
		function () {
			if ($(this).val() === "custom") {
				$("input[type='text']#custom").show();
			} else {
				$("input[type='text']#custom").hide();
			}
		}
	);

	const EVALUATE_CALL_OBJ = [
		...getLocalizedFunctionList(locale().functionlist),
	].find((i) => i.n === "EVALUATE");

	console.log(
		"==> ",
		functionImplementation.EVALUATE.call(EVALUATE_CALL_OBJ, "3*3+4")
	);
}
// 日期计算
function initDateDiffHandle() {}
// 排序
function initRankingHandle() {}
// 身份信息提取
function initIdInfoHandle() {}
// 脚本
function initScriptHandle() {
	// 1. 隐藏样例
	$(".luckysheet-superformula-dialog-content .example").hide();

	// 2. 加载 codeFlask 依赖
	const dependScripts = [
		"expendPlugins/codejar/codejar.js",
		"https://unpkg.com/@highlightjs/cdn-assets@11.9.0/highlight.min.js",
	];
	const dependLinks = [
		"https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/atom-one-dark.min.css",
	];
	loadLinks(dependLinks);

	function initEditor() {
		console.log("==> CodeFlask 加载完成");
		const editorDOM = $("#editor")[0];
		// hljs.highlightElement(editorDOM);
		let jar = CodeJar(editorDOM, (editor) => {
			$(editorDOM).html(
				hljs.highlight(editor.textContent, { language: "js" }).value
			);
		});
		jar.updateCode(`/** 数据处理函数 - 参数说明
 * @param { string[][] } data
 * @param {  } rangeArray
 */
console.log('数据源 data',data)
console.log('选区范围 rangeArray',rangeArray)	
			`);
	}

	// 不能每次都加载，会报错的，应该需要判断
	if (window.CodeJar) return initEditor();

	seriesLoadScripts(dependScripts, null, initEditor);
}
// latex
function initLatexHandle() {}

// 打开二级菜单
function openSubMenu() {
	let menuButtonId = "luckysheet-icon-superFormula-dialog-menuButton";
	let $menuButton = $("#" + menuButtonId);
	const locale_superFormula = locale().superFormula;
	$menuButton.remove();
	luckysheetPostil.removeActivePs();
	let itemdata = [
		{ text: locale_superFormula.compute, value: "compute", example: "" },
		{ text: locale_superFormula.dateDiff, value: "dateDiff", example: "" },
		{ text: "", value: "split", example: "" },
		{ text: locale_superFormula.ranking, value: "ranking", example: "" },
		{ text: locale_superFormula.idInfo, value: "idInfo", example: "" },
		{ text: "", value: "split", example: "" },
		{ text: locale_superFormula.script, value: "script", example: "" },
		{ text: locale_superFormula.latex, value: "latex", example: "" },
	];
	let itemset = menuButton.createButtonMenu(itemdata);

	let menu = replaceHtml(menuButton.menu, {
		id: "superFormula-dialog",
		item: itemset,
		subclass: "",
		sub: "",
	});
	$("body").append(menu);

	$menuButton = $("#" + menuButtonId).width(170);
	$menuButton = $("#" + menuButtonId).css("z-index", "10000");

	// 给子项注册事件
	$menuButton.find(".luckysheet-cols-menuitem").click(function () {
		$menuButton.hide();
		luckysheetContainerFocus();

		let $t = $(this),
			itemvalue = $t.attr("itemvalue");

		if (itemvalue === "compute") {
			superFormulaCompute();
		} else if (itemvalue === "dateDiff") {
			superFormulaDateDiff();
		} else if (itemvalue === "ranking") {
			superFormulaRanking();
		} else if (itemvalue === "idInfo") {
			superFormulaIdInfo();
		} else if (itemvalue === "script") {
			superFormulaScript();
		} else if (itemvalue === "latex") {
			superFormulaLatex();
		}
	});

	let userlen = $(this).outerWidth();
	let tlen = $menuButton.outerWidth();

	let menuleft = $(this).offset().left;
	if (tlen > userlen && tlen + menuleft > $("#" + Store.container).width()) {
		menuleft = menuleft - tlen + userlen;
	}
	mouseclickposition(
		$menuButton,
		menuleft,
		$(this).offset().top + 25,
		"lefttop"
	);
}

export {
	superFormulaCompute,
	superFormulaDateDiff,
	superFormulaRanking,
	superFormulaIdInfo,
	superFormulaScript,
	superFormulaLatex,
};

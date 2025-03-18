import { seriesLoadScripts, loadLinks } from "../../utils/util";

/**
 * 文件导出 需要依赖两个库 exceljs file-saver
 */
const dependScripts = [
];

const dependLinks = [];

export function fileExport(data, isDemo) {
	// 加载 css
	loadLinks(dependLinks);

	// 加载 js 依赖
	seriesLoadScripts(dependScripts, null, () => {
		console.log("## 文件导出插件相关依赖加载完成！");
	});
}


import { seriesLoadScripts, loadLinks } from "../../utils/util";

const dependScripts = [];

const dependLinks = [];

function fileImport(data, isDemo) {
	// 加载 css
	loadLinks(dependLinks);

	// 加载 js 依赖
	seriesLoadScripts(dependScripts, null);
}

export {fileImport}

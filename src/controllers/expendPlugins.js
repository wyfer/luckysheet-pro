// import { chart } from "../expendPlugins/chart/plugin";
import { print } from "../expendPlugins/print/plugin";
// import { vchart } from "../expendPlugins/vchart/plugin";
import { fileImport } from "../expendPlugins/fileImport/plugin";
import { fileExport } from "../expendPlugins/fileExport/plugin";
const pluginsObj = {
	// chart: chart,
	// print: print,
	// vchart: vchart,
	fileImport: fileImport,
	fileExport: fileExport,
};

const isDemo = true;

/**
 * Register plugins
 */
function initPlugins(plugins, data) {
	if (plugins.length) {
		plugins.forEach((plugin) => {
			pluginsObj[plugin](data, isDemo);
		});
	}
}

export { initPlugins };

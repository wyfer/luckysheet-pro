/**
 * 文件菜单实现函数
 */
import {
  deleteSheetByIndex,
  getAllSheets,
  getWorkbookName,
  setSheetAdd,
} from "../global/api";
import { replaceHtml } from "../utils/chartUtil";
import luckysheetConfigsetting from "./luckysheetConfigsetting";
import Store from "../store";
import sheetmanage from "./sheetmanage";
import LuckyExcel from "../plugins/js/importFile";
import { setStyleAndValue, setMerge, setBorder } from "../utils/fileExport";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function fileNew() {}

function fileSaveAs() {}

/**
 * 文件导入
 */
function fileImport() {
  // 判断是否存在 导入插件，不存在则提示
  // if (!Reflect.get(window, "LuckyExcel")) {
  // 	alert("请先注册插件 fileImport");
  // 	return;
  // }

  let file = null;

  // 创建配置面板
  const $content =
    '<div class="luckysheet-import-mask"><div class="luckysheet-import-setting"><div class="luckysheet-import-title"><span class="title">${title}</span><span class="close" id="close" title="${close}"><i class="fa fa-close" aria-hidden="true"></i></span></div><div class="luckysheet-import-content"><i class="fa fa-cloud-upload" aria-hidden="true" /></i><p>Drop file here or <span>click to upload</span></p></div><div class="luckysheet-import-content-mode">导入模式:<input  type="radio" id="cover" name="mode" value="cover" checked> <label for="cover">覆盖Sheet导入</label><input  type="radio" id="newsheet" name="mode" value="newsheet"> <label for="newsheet">新建Sheet导入</label></div><div class="luckysheet-import-content-result">导入文件:<span id="file-result"></span></div><div class="luckysheet-import-content-footer"><span class="cancel">${cancel}</span><span class="confirm">${confirm}</span></div></div></div>';

  // 添加到 body 上
  $("body").append(
    replaceHtml($content, {
      title: "导入文件",
      close: "关闭",
      cancel: "取消",
      confirm: "导入",
    })
  );

  // 取下 关闭按钮事件
  const close = () => $(".luckysheet-import-mask").remove();
  $(".luckysheet-import-content-footer .cancel").click(close);
  $(".luckysheet-import-title .close").click(close);

  // 实现 点击 上传文件
  $(".luckysheet-import-content").click(() => {
    const $input = $("<input type='file' id='luckysheet-import-input' />");
    $input.click();
    $input.change((e) => {
      file = e.target.files[0];
      $(".luckysheet-import-content-result #file-result").text(file.name);
    });
  });

  // 实现 拖住 上传文件

  // 确认按钮
  $(".luckysheet-import-content-footer .confirm").click(() => {
    // 获取导入模式
    const mode = $("input[name='mode']:checked").val();

    if (!file) return console.error("导入文件异常");

    // 因为 luckysheet 至少需要保留一个 sheet ,所以如果是覆盖式导入的话,需要先插入 sheet 后删除 sheet
    const currentSheets = getAllSheets();
    // 1. 获取目前的 luckysheetfile
    const luckysheetNameMap = Store.luckysheetfile.map((i) => i.name);

    // transformExcelToLucky 是异步回调的形式执行的,因此,删除操作西药放置到函数内部
    LuckyExcel.transformExcelToLucky(file, ({ sheets }) => {
      console.log("sheets", sheets);
      (sheets || []).forEach((sheet) => {
        // 针对当前导入的sheet 创建 order index ,处理 name 属性
        let order = Store.luckysheetfile.length;
        let index = sheetmanage.generateRandomSheetIndex();
        let sheetname = luckysheetNameMap.includes(sheet.name)
          ? sheetmanage.generateCopySheetName(Store.luckysheetfile, sheet.name)
          : sheet.name;
        setSheetAdd({
          sheetObject: {
            ...sheet,
            name: sheetname,
            status: "0",
            order: order,
            index: index,
          },
          order,
        });
      });

      if (mode !== "cover") return close();

      // 删除sheet
      currentSheets.forEach(({ index }) => deleteSheetByIndex({ index }));
      close();
    });
  });
}
/**
 * 文件导入
 */
function importFile(file) {
  if (!file) return console.error("导入文件异常");

  // 因为 luckysheet 至少需要保留一个 sheet ,所以如果是覆盖式导入的话,需要先插入 sheet 后删除 sheet
  const currentSheets = getAllSheets();
  // 1. 获取目前的 luckysheetfile
  const luckysheetNameMap = Store.luckysheetfile.map((i) => i.name);

  try {
    // transformExcelToLucky 是异步回调的形式执行的,因此,删除操作西药放置到函数内部
    LuckyExcel.transformExcelToLucky(file, ({ sheets }) => {
      console.log(sheets);
      (sheets || []).forEach((sheet) => {
        // 针对当前导入的sheet 创建 order index ,处理 name 属性
        let order = Store.luckysheetfile.length;
        let index = sheetmanage.generateRandomSheetIndex();
        let sheetname = luckysheetNameMap.includes(sheet.name)
          ? sheetmanage.generateCopySheetName(Store.luckysheetfile, sheet.name)
          : sheet.name;

        setSheetAdd({
          sheetObject: {
            ...sheet,
            name: sheetname,
            status: "0",
            order: order,
            index: index,
          },
          order,
        });
      });

      // 删除sheet
      currentSheets.forEach(({ index }) => deleteSheetByIndex({ index }));
    });
  } catch (e) {
    console.error(e);
  }
}

function clearSheets() {
  // 因为 luckysheet 至少需要保留一个 sheet ,所以如果是覆盖式导入的话,需要先插入 sheet 后删除 sheet
  const currentSheets = getAllSheets();
  // 删除sheet
  currentSheets.forEach(({ index }) => deleteSheetByIndex({ index }));
}

/**
 * 文件导出
 */
async function fileExport() {
  // 导出文件需要两个东西 name  allSheet
  const workerBookName = getWorkbookName();
  const sheets = getAllSheets();

  // 获取 sheet 的 buffer 信息
  const workbook = new ExcelJS.Workbook();
  // 创建表格，第二个参数可以配置创建什么样的工作表
  sheets.every(function (table) {
    if (table.data.length === 0) return true;
    const worksheet = workbook.addWorksheet(table.name);
    // 3.设置单元格合并,设置单元格边框,设置单元格样式,设置值
    setStyleAndValue(table.data, worksheet);
    setMerge(table.config.merge, worksheet);
    setBorder(table, worksheet);

    console.log(worksheet);
    return true;
  });

  // 写入 buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // 保存文件
  try {
    const blob = new Blob([buffer], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    saveAs(blob, `${workerBookName.split(".")[0]}.xlsx`);
    console.log("文件导出成功");
  } catch (error) {
    console.error("文件导出失败");
  }
}

/**
 * 文件导出
 */
async function getExportData() {
  // 导出文件需要两个东西 name  allSheets
  const workerBookName = getWorkbookName();
  const sheets = getAllSheets();

  // 获取 sheet 的 buffer 信息
  const workbook = new ExcelJS.Workbook();
  // 创建表格，第二个参数可以配置创建什么样的工作表
  sheets.every(function (table) {
    if (table.data.length === 0) return true;
    const worksheet = workbook.addWorksheet(table.name);
    // 3.设置单元格合并,设置单元格边框,设置单元格样式,设置值
    setStyleAndValue(table.data, worksheet);
    setMerge(table.config.merge, worksheet);
    setBorder(table, worksheet);
    return true;
  });
  // 写入 buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    workerBookName,
    sheets,
    Store,
    buffer,
  };
}

function fileShear() {
  if (
    luckysheetConfigsetting &&
    luckysheetConfigsetting.menuHandler &&
    luckysheetConfigsetting.menuHandler.shear
  )
    luckysheetConfigsetting.menuHandler.shear();
}

function filePrint() {}

function fileSetting() {}

/**
 * 文档解密
 */
function fileDecryption() {
  // 添加一个内容区
  const $content =
    '<div class="luckysheet-encrypt-mask"><div class="luckysheet-encrypt-content"><div class="luckysheet-encrypt-content-title"> <span class="title">${title}</span><span class="close" id="close" title="${close}"><i class="fa fa-close" aria-hidden="true"></i></span></div><div class="luckysheet-encrypt-tips">${tips}</div><div class="luckysheet-encrypt-content-input"><i class="fa fa-lock" aria-hidden="true" /></i><input type="password" id="luckysheet-encrypt-input" aotucomplete="off" placeholder="${placeholder}"></input></div><div class="luckysheet-encrypt-content-result"></div><div class="luckysheet-encrypt-content-footer"><span class="cancel">${cancel}</span><span class="confirm">${confirm}</span></div></div></div>';
  // 添加到 body 上
  $("body").append(
    replaceHtml($content, {
      title: "文档解密",
      close: "关闭",
      tips: "请输入文档密码:",
      placeholder: "请输入文档密码",
      cancel: "取消",
      confirm: "解密",
    })
  );

  // 实现关闭
  // 注册关闭事件
  $(".luckysheet-encrypt-content-footer .cancel").click(() => {
    $(".luckysheet-encrypt-mask").remove();
  });
  $("#close").click(() => {
    $(".luckysheet-encrypt-mask").remove();
  });

  // 在输入过程中，清空 result 结果提示
  $("#luckysheet-encrypt-input").on("input", () => {
    $(".luckysheet-encrypt-content-result").text("");
  });

  // 实现应用
  $(".luckysheet-encrypt-content-footer .confirm").click(() => {
    // 将参数传递给用户
    const password = $("#luckysheet-encrypt-input").val();
    // 暂时传递明文，用户存储数据库的话，建议使用 bcrypt 进行处理
    if (
      luckysheetConfigsetting &&
      luckysheetConfigsetting.menuHandler &&
      luckysheetConfigsetting.menuHandler.decrypt
    ) {
      const value = luckysheetConfigsetting.menuHandler.decrypt(password);
      if (value) {
        // 关闭
        $(".luckysheet-encrypt-mask").remove();
      } else {
        // 密码错误
        $(".luckysheet-encrypt-content-result").text("⛔️ 密码错误!");
        $("#luckysheet-encrypt-input").val("");
      }
    }
  });
}

/**
 * 文档加密
 */
function fileEncryption() {
  // 添加一个内容区
  const $content =
    '<div class="luckysheet-encrypt-mask"><div class="luckysheet-encrypt-content"><div class="luckysheet-encrypt-content-title"> <span class="title">${title}</span><span class="close" id="close" title="${close}"><i class="fa fa-close" aria-hidden="true"></i></span></div><div class="luckysheet-encrypt-tips">${tips}</div><div class="luckysheet-encrypt-content-input"><i class="fa fa-lock" aria-hidden="true" /></i><input type="password" id="luckysheet-encrypt-input" aotucomplete="off" placeholder="${placeholder}"></input></div><div class="luckysheet-encrypt-content-result"></div><div class="luckysheet-encrypt-content-footer"><span class="cancel">${cancel}</span><span class="confirm">${confirm}</span></div></div></div>';
  // 添加到 body 上
  $("body").append(
    replaceHtml($content, {
      title: "文档加密",
      close: "关闭",
      tips: "请输入文档密码:",
      placeholder: "请输入文档密码",
      cancel: "取消",
      confirm: "应用",
    })
  );

  // 实现关闭
  // 注册关闭事件
  $(".luckysheet-encrypt-content-footer .cancel").click(() => {
    $(".luckysheet-encrypt-mask").remove();
  });
  $("#close").click(() => {
    $(".luckysheet-encrypt-mask").remove();
  });

  // 实现应用
  $(".luckysheet-encrypt-content-footer .confirm").click(() => {
    // 将参数传递给用户
    const password = $("#luckysheet-encrypt-input").val();
    // 暂时传递明文，用户存储数据库的话，建议使用 bcrypt 进行处理
    console.log("==> 请妥善保管密码：", password);
    if (
      luckysheetConfigsetting &&
      luckysheetConfigsetting.menuHandler &&
      luckysheetConfigsetting.menuHandler.encryption
    )
      luckysheetConfigsetting.menuHandler.encryption(password);

    // 关闭
    $(".luckysheet-encrypt-mask").remove();
  });
}

function fileHelp() {}

function fileExit() {
  // 退出的逻辑交给用户
  if (
    luckysheetConfigsetting &&
    luckysheetConfigsetting.menuHandler &&
    luckysheetConfigsetting.menuHandler.exit
  )
    luckysheetConfigsetting.menuHandler.exit();
}

export {
  fileImport,
  fileExport,
  importFile,
  getExportData,
  fileNew,
  fileSaveAs,
  fileShear,
  filePrint,
  fileSetting,
  fileHelp,
  fileExit,
  fileEncryption,
  fileDecryption,
  clearSheets,
};

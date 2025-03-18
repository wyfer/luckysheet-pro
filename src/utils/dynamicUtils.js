// 解析 ${ }中的内容
export function parseDynamicStr(str) {
  const isAttr = str.startsWith('bindData:');
  const isRowAttr = str.startsWith('bindRowData:');

  let reg = /\$\{([^}]+)\}/g;
  let match = reg.exec(str);

  let result = {
    isAttr,
    isRowAttr,
    data: {
      attrType: "",
      attrTypeName: "",
      attrValue: "",
      attrValueName: "",
      dateFormat: "",
    }
  };

  if (match) {
    const [attrType, attrTypeName, attrValue, attrValueName, dateFormat] = match[1].split("/");

    result.data = {
      attrType,
      attrTypeName,
      attrValue,
      attrValueName,
      dateFormat,
    };
  }

  return result;
}

// 生成${}形式属性
export function generateDynamicShowStr(str) {
  if(str == '' || str == undefined || str == null) return '';

  const {isAttr, isRowAttr, data} = parseDynamicStr(str);
  
  const {attrTypeName,attrValueName} = data;
  // 如果是对象，通过Object.values转为数组
  // let d = [attrTypeName,attrValueName];

  // return (isRowAttr ? "[R]" : "") + "[" + d.join("/") + "]";

  return (isRowAttr ? "[R]" : "") + "[" + attrValueName + "]";
}

// 生成${}形式属性
export function generateDynamicStr(data) {
  // 如果是对象，通过Object.values转为数组
  let d = (Object.prototype.toString.call(data) === "[object Object]" ? Object.values(data) : data) || [];

  return "${" + d.join("/") + "}";
}

// 单元格展示形式
export function displayDynamicStr(arr) {
  if (arr.length === 0) {
    return "";
  }
  return "[" + arr.join("/") + "]";
}
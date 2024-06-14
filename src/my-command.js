var sketch = require("sketch");
var document = sketch.getSelectedDocument();
var UI = sketch.UI;

// 创建一个初始值,用于控制输入框的大小
var initialValue = "";
for (var i = 0; i < 20; i++) {
  initialValue += "\n";
}

// 显示多行输入框,获取用户输入的CSS
UI.getInputFromUser(
  "请输入CSS代码:",
  { initialValue: initialValue },
  (error, cssCode) => {
    if (error) {
      // 处理错误
      console.log("Error getting user input:");
      console.log(error);
      return;
    }

    // 如果用户取消了输入,就退出脚本
    if (cssCode === null) {
      sketch.UI.message("用户取消了输入");
      return;
    }

    // 使用正则表达式提取CSS中的颜色变量
    var colorRegex = /var\(--(.+?)\):\s*(#[a-fA-F0-9]{8})/g;
    var colors = [];

    var match;
    while ((match = colorRegex.exec(cssCode))) {
      colors.push({
        name: match[1].trim(),
        hex: match[2].trim(),
      });
    }

    // 如果没有找到任何颜色变量,就显示错误信息并退出脚本
    if (colors.length === 0) {
      UI.message("未找到任何颜色变量");
      return;
    }

    var createdCount = 0;
    var updatedCount = 0;

    // 遍历提取的颜色变量
    for (var i = 0; i < colors.length; i++) {
      var colorData = colors[i];
      var name = "var(--" + colorData.name + ")";
      var hex = colorData.hex;
      var alpha = parseInt(hex.substr(7), 16) / 255;
      var color = MSColor.colorWithHex_alpha(hex.substr(0, 7), alpha);

      // 在文档中查找具有相同名称的色板
      var swatch = document.swatches.find(function (s) {
        return s.name === name;
      });

      if (swatch) {
        // 如果找到了具有相同名称的色板,就更新它的颜色
        swatch.color = color;
        updatedCount++;
      } else {
        // 如果没有找到具有相同名称的色板,就创建一个新的色板
        document.swatches.push({
          name: name,
          color: color,
        });
        createdCount++;
      }
    }

    // 显示成功信息
    UI.message(
      "成功创建了" +
        createdCount +
        "个颜色变量,更新了" +
        updatedCount +
        "个颜色变量",
    );
  },
);

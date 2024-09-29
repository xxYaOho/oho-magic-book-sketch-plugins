var sketch = require("sketch");
var document = sketch.getSelectedDocument();
var UI = sketch.UI;

// 创建一个初始值,用于控制输入框的大小
var initialValue = "";

// 显示多行输入框,获取用户输入的CSS
UI.getInputFromUser(
  "请输入CSS代码:",
  { initialValue: initialValue, numberOfLines: 10 },
  (error, cssCode) => {
    if (error) {
      console.log("Error getting user input:", error);
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

    // 询问用户要执行的操作
    UI.getInputFromUser(
      "选择操作:",
      {
        type: UI.INPUT_TYPE.selection,
        possibleValues: ["导入新色板", "更新现有色板"],
      },
      (err, choice) => {
        if (err) {
          // 用户取消了操作
          return;
        }

        var createdCount = 0;
        var updatedCount = 0;

        // 遍历提取的颜色变量
        for (var i = 0; i < colors.length; i++) {
          var colorData = colors[i];
          var name = "var(--" + colorData.name + ")";
          var hex = colorData.hex;

          // 在文档中查找具有相同名称的色板
          var swatch = document.swatches.find((s) => s.name === name);

          if (choice === "导入新色板") {
            if (!swatch) {
              console.log("Creating new swatch:", name, hex);
              document.swatches.push({ name: name, color: hex });
              createdCount++;
            }
          } else if (choice === "更新现有色板") {
            if (swatch) {
              console.log("Updating swatch:", name, "to", hex);
              // 更新色板颜色，保留 alpha 值
              var red = parseInt(hex.slice(1, 3), 16) / 255;
              var green = parseInt(hex.slice(3, 5), 16) / 255;
              var blue = parseInt(hex.slice(5, 7), 16) / 255;
              var alpha = parseInt(hex.slice(7, 9), 16) / 255;
              var mscolor = MSColor.colorWithRed_green_blue_alpha(
                red,
                green,
                blue,
                alpha,
              );
              swatch.sketchObject.updateWithColor(mscolor);

              // 更新所有使用该色板的地方
              let swatchContainer = document.sketchObject
                .documentData()
                .sharedSwatches();
              swatchContainer.updateReferencesToSwatch(swatch.sketchObject);
              updatedCount++;
            }
          }
        }

        // 显示成功信息
        if (choice === "导入新色板") {
          UI.message("成功创建了" + createdCount + "个颜色变量");
        } else {
          UI.message("成功更新了" + updatedCount + "个颜色变量");
        }
      },
    );
  },
);

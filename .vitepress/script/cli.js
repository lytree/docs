const { program } = require('commander');
const fs = require('fs');
const path = require("path");
const dayjs = require("dayjs");
const matter = require('gray-matter');




var date = dayjs().format('YYYY-MM-DD HH:mm:ss')
var datePath = dayjs().format('YYYYMMDD')



function getFiles(
    dir,
    fileSuffixList = [".md"],
    ignoreDirectories = [".vitepress", "node_modules"]
) {
    const files = fs.readdirSync(dir);
    let allFiles = [];

    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 检查当前目录是否在忽略列表中
            const relativePath = path.relative(process.cwd(), fullPath);
            if (
                !ignoreDirectories.some((ignorePath) =>
                    relativePath.startsWith(ignorePath)
                )
            ) {
                allFiles = allFiles.concat(getFiles(fullPath, fileSuffixList, ignoreDirectories));
            }
        } else {
            // 检查文件后缀是否在指定列表中
            const fileExt = path.extname(file);
            if (fileSuffixList.includes(fileExt)) {
                allFiles.push(fullPath);
            }
        }
    });

    return allFiles;
}



function createFenMd(dir) {
    if (!fs.existsSync(path.join(dir, datePath))) {
        fs.mkdirSync(path.join(dir, datePath))
    }
    const fenbi =
        `---
title:  总结
date: ${date}
---
# 总结
`
    const fenbi1 =
        `---
title:  政治
date: ${date}
---
# 政治
`

    const fenbi2 =
        `---
title:  常识
date: ${date}
---

# 常识
`
    const fenbi3 =
        `---
title:  言语
date: ${date}
---
# 言语


## 逻辑填空


## 片段阅读

### 中心理解

### 细节判断

## 语句表达

### 语句排序

### 语句填空

### 语句选择
`
    const fenbi4 =
        `---
title:  判断
date: ${date}
---

# 判断

## 图推

## 逻辑判断

## 定义判断

## 类比推理

## 一拖五

`
    const fenbi5 =
        `---
title:  资料
date: ${date}
---
# 资料
`
    const fenbi6 =
        `---
title:  数量
date: ${date}
---
# 数量
`
    fs.writeFileSync(path.join(dir, datePath, "index.md"), fenbi)
    fs.writeFileSync(path.join(dir, datePath, "1.md"), fenbi1)
    fs.writeFileSync(path.join(dir, datePath, "1.md"), fenbi1)
    fs.writeFileSync(path.join(dir, datePath, "2.md"), fenbi2)
    fs.writeFileSync(path.join(dir, datePath, "3.md"), fenbi3)
    fs.writeFileSync(path.join(dir, datePath, "4.md"), fenbi4)
    fs.writeFileSync(path.join(dir, datePath, "5.md"), fenbi5)
    fs.writeFileSync(path.join(dir, datePath, "6.md"), fenbi6)
}

function createFenSider(dir) {
    var files = getFiles(path.join(dir, datePath))
    console.log(files)
    var json = `
        text: '${datePath}',link: "${dir}.split(path.sep).join('/')", collapsed: true, items: [
        ${files.map((item) => {
        var text = "";
        if (!item.includes("index.md")) {
            var text = String.raw`{
                text: "${matter(fs.readFileSync(item)).data.title}",
                link: "${item.split(path.sep).join('/')}"
            }`;
        }

        return text;

    })}
            
        ]
`
    console.log(json)
}

var create = program.command("create")

create.option('-t, --type <string>', '创建模板类型')
    .option('-p, --path <string>', '创建路径', "./official/fenbi")
    .action(async (option) => {
        console.log(option)
        try {
            if (option.type == "fenbi") {
                createFenMd(option.path)
            }
        } catch (e) {
            console.log(e)
            process.exit(-1)
        }
    })



var sider = program.command("sider")
    .option('-t, --type <string>', '创建模板类型')
    .option('-p, --path <string>', '创建路径', "./official/fenbi")
    .action(async (option) => {
        console.log(option)
        try {
            if (option.type == "fenbi") {
                createFenSider(option.path)
            }
        } catch (e) {
            console.log(e)
            process.exit(-1)
        }
    })



program.parse()
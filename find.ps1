# 指定需要遍历的目录（注意修改为你实际使用的路径）
$directory = "/root/github/docs/docs/script/java/effectivejava"
Push-Location "/root/github/docs"

$files = Get-ChildItem -Path $directory -File -Recurse

foreach ($file in $files) {
    # 读取 Markdown 文件内容
    $mdContent = Get-Content -Path $file.FullName -Raw

    # 构建支持 Singleline 的正则表达式对象
    $pattern = [regex]::new('^---\s*(.*?)\s*---', [System.Text.RegularExpressions.RegexOptions]::Singleline)

    # 执行匹配
    $match = $pattern.Match($mdContent)
    if ($match.Success) {
        $yamlText =  $match.Groups[1].Value

        # 使用 ConvertFrom-Yaml（需要 PowerShell 7+，或导入Yaml模块）
        $yamlObject = $yamlText | ConvertFrom-Yaml

        # # 输出结果
        # $yamlObject
        # 获取相对路径
        $relativePath = Resolve-Path -Path $file.FullName -Relative
        $block = "
        {
            link: '$($relativePath)',
            text: '$($yamlObject.title)'
        },
        "
        # Write-Output "文件：$($relativePath)"
        # Write-Output "标题：$($yamlObject.title)"
        Write-Output $block
    }

}
Pop-Location
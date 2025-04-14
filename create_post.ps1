param([string]$title,[string]$name,[string]$path,[string]$type,[string]$tags)
# Install-Module powershell-yaml
# Import-Module powershell-yaml

$locPath = (Get-Location).Path
# 指定需要遍历的目录（注意修改为你实际使用的路径）
$filePath = Join-Path $locPath  -ChildPath  $path

if (-not $name) {
    $name = $(Get-Date -Format "yyyy-MM-dd") + ".md"
}
if (-not $title) {
    $title = $(Get-Date -Format "yyyy-MM-dd")
}

$text = 
"
---
router: $type
title: $title
date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
tags: $tags
---
"






Set-Content -Path $(Join-Path -Path $filePath -ChildPath $name) -Value  $text
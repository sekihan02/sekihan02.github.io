param(
  [Parameter(Mandatory = $true)]
  [string]$Title,

  [Parameter(Mandatory = $true)]
  [string]$Slug,

  [string]$Category = "General",

  [string[]]$Tags = @("note")
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$articlesDir = Join-Path $repoRoot "content\articles"
$imagesRootDir = Join-Path $repoRoot "apps\site\public\images\articles"
$articleImagesDir = Join-Path $imagesRootDir $Slug
$targetPath = Join-Path $articlesDir "$Slug.mdx"

if (Test-Path $targetPath) {
  throw "Article file already exists: $targetPath"
}

$today = Get-Date -Format "yyyy-MM-dd"
$tagYaml = ($Tags | ForEach-Object { "  - $_" }) -join "`r`n"

$content = @"
---
title: $Title
slug: $Slug
publishedAt: $today
updatedAt: $today
summary: Write a one-line summary here.
category: $Category
tags:
$tagYaml
draft: false
---

# $Title

Start writing here.

## Background

Explain why this topic matters.

## Main Part

Write the steps, design, or notes here.

## Summary

Close with a short summary.
"@

Set-Content -Path $targetPath -Value $content -Encoding utf8
New-Item -ItemType Directory -Path $articleImagesDir -Force | Out-Null
Write-Host "Created article template: $targetPath"
Write-Host "Created image folder: $articleImagesDir"
Write-Host "Next step: npm run content:build"

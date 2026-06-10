Add-Type -AssemblyName System.IO.Compression.FileSystem

$files = @(
  'backend/data/SYSTEM REQUIREMENTS DOCUMENT for VHW APP.docx',
  'backend/data/SYSTEM REQUIREMENT DOCUMENT 11052026.docx',
  'backend/data/Front-End Payment Management System (FEPMS) Final.docx'
)

foreach ($f in $files) {
  $fullPath = Join-Path $PSScriptRoot $f
  $zip = [System.IO.Compression.ZipFile]::OpenRead($fullPath)
  $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  $xml = $reader.ReadToEnd()
  $reader.Close()
  $stream.Close()
  $zip.Dispose()

  $matches = [regex]::Matches($xml, '<w:t[^>]*>([^<]*)</w:t>')
  $parts = @()
  foreach ($m in $matches) {
    $parts += $m.Groups[1].Value
  }
  $text = $parts -join ' '

  $out = $fullPath -replace '\.docx$','_extracted.txt'
  [IO.File]::WriteAllText($out, $text)
  Write-Output "$([IO.Path]::GetFileName($f)): $($text.Length) chars -> $out"
}

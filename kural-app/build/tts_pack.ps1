param(
  [Parameter(Mandatory=$true)][string]$Manifest,   # JSON: [{"id":"0001","ssml":"<speak ...>"}, ...]
  [Parameter(Mandatory=$true)][string]$Lang,       # BCP-47, e.g. ta-IN
  [Parameter(Mandatory=$true)][string]$OutDir,
  [double]$Rate = 0.85
)
# Synthesize every manifest item to WAV with the installed Windows OneCore voice for $Lang.
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType=WindowsRuntime]
function Await($WinRtTask, $ResultType) {
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}
$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | ? { $_.Language -eq $Lang } | Select-Object -First 1
if (-not $voice) { Write-Error "no voice for $Lang"; exit 2 }
$synth.Voice = $voice
$synth.Options.SpeakingRate = $Rate
New-Item -ItemType Directory -Force $OutDir | Out-Null
$items = Get-Content -Raw -Encoding UTF8 $Manifest | ConvertFrom-Json
$done = 0
foreach ($it in $items) {
  $wav = Join-Path $OutDir ($it.id + '.wav')
  $mp3 = Join-Path $OutDir ($it.id + '.mp3')
  if ((Test-Path $mp3) -or (Test-Path $wav)) { $done++; continue }
  try {
    $stream = Await ($synth.SynthesizeSsmlToStreamAsync($it.ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
    $size = $stream.Size
    $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
    $null = Await ($reader.LoadAsync([uint32]$size)) ([uint32])
    $bytes = New-Object byte[] $size
    $reader.ReadBytes($bytes)
    [System.IO.File]::WriteAllBytes($wav, $bytes)
    $done++
  } catch {
    Write-Warning ("fail " + $it.id + ": " + $_.Exception.Message)
  }
}
"synthesized $done / $($items.Count) with $($voice.DisplayName)"

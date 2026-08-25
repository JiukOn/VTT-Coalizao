param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ArgsList
)

if (Get-Command python -ErrorAction SilentlyContinue) {
    & python "$PSScriptRoot\infra\scripts\vtt_cli.py" @ArgsList
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    & py "$PSScriptRoot\infra\scripts\vtt_cli.py" @ArgsList
} else {
    & node "$PSScriptRoot\infra\scripts\vtt_cli.js" @ArgsList
}

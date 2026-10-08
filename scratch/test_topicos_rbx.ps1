$headers = @{
    "Content-Type" = "application/json"
}

$body = '{
    "ConsultaTopicosAtendimento": {
        "Autenticacao": {
            "ChaveIntegracao": "EN6PYLEGXSV7LK3LL2YQ6R1E5U2LG2"
        }
    }
}'

try {
    $res = Invoke-RestMethod -Uri "https://sistema.solprovedor.com.br/routerbox/ws/rbx_server_json.php" -Method Post -Headers $headers -Body $body
    Write-Host "Status: $($res.status)"
    Write-Host ($res | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
}

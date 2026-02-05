$filePath = "c:\operadora-dev\src\app\page.tsx"
$content = Get-Content $filePath -Raw

# Buscar y eliminar la sección de botones duplicados (líneas 2673-2692)
$pattern = @'
            \{/\* CTA adicional \*/\}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
                onClick=\{\(\) => router\.push\('/tours'\)\}
              >
                <Globe className="w-5 h-5 mr-2" />
                Explorar todos los tours
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8"
                onClick=\{\(\) => router\.push\('/viajes-grupales'\)\}
              >
                <Users className="w-5 h-5 mr-2" />
                Cotización para grupos \(\+10 personas\)
              </Button>
            </div>
'@

$replacement = '            {/* CTA adicional - ELIMINADO (duplicado) */}'

$newContent = $content -replace [regex]::Escape($pattern).Replace('\{','{').Replace('\}','}').Replace('\(',  '(').Replace('\)','').Replace('\.','.'),$replacement

$newContent | Set-Content $filePath -NoNewline

Write-Host "✅ Botones duplicados eliminados"

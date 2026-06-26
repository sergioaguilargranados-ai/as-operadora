"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, X, CheckCircle, Download, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"

interface ExcelUploaderProps {
  onUpload: (data: any[]) => void
  expectedColumns?: string[]
  templateName?: string
  buttonText?: string
}

export function ExcelUploader({ onUpload, expectedColumns = [], templateName = "Plantilla", buttonText = "Importar Excel" }: ExcelUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [error, setError] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    setError("")
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const parsedData = XLSX.utils.sheet_to_json(sheet)

        if (parsedData.length === 0) {
          setError("El archivo está vacío o no tiene el formato correcto.")
          return
        }

        // Validate columns if expectedColumns is provided
        if (expectedColumns.length > 0) {
          const firstRow = parsedData[0] as object
          const columns = Object.keys(firstRow)
          const missingColumns = expectedColumns.filter(col => !columns.includes(col))
          if (missingColumns.length > 0) {
            setError(`Faltan columnas requeridas: ${missingColumns.join(", ")}`)
            return
          }
        }

        setPreviewData(parsedData)
      } catch (err) {
        setError("Error al procesar el archivo. Asegúrate de que es un Excel o CSV válido.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleConfirm = () => {
    onUpload(previewData)
    clearFile()
  }

  const clearFile = () => {
    setFile(null)
    setPreviewData([])
    setError("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      expectedColumns.reduce((acc, col) => ({ ...acc, [col]: `Ejemplo ${col}` }), {})
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
    XLSX.writeFile(wb, `${templateName}.xlsx`)
  }

  return (
    <div className="w-full">
      {!file ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Subir archivo de datos</h3>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-[#0066FF] border-[#0066FF] hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              dragActive ? "border-[#0066FF] bg-blue-50" : "border-gray-200 hover:bg-gray-50 bg-white"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleChange}
            />
            <div className="w-12 h-12 bg-blue-50 text-[#0066FF] rounded-full flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-900">Haz clic o arrastra un archivo aquí</p>
            <p className="text-sm text-gray-500 mt-1">Soporta formatos .xlsx, .xls, y .csv</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB • {previewData.length} registros detectados</p>
              </div>
            </div>
            <button onClick={clearFile} className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : previewData.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Vista previa (Primeros 3 registros)</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 bg-gray-50 border-b">
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="px-4 py-2">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="bg-white border-b last:border-0">
                        {Object.values(row as object).map((val, j) => (
                          <td key={j} className="px-4 py-2 truncate max-w-[150px]">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <Button 
            className="w-full bg-[#0066FF] hover:bg-blue-700 text-white"
            disabled={!!error || previewData.length === 0}
            onClick={handleConfirm}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar y {buttonText}
          </Button>
        </div>
      )}
    </div>
  )
}

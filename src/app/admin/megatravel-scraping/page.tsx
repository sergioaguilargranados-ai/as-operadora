// src/app/admin/megatravel-scraping/page.tsx
// Panel unificado: Sincronización + Scraping MegaTravel
// Build: 19 Feb 2026 - v2.322 - Flujo unificado Sync→Scraping con logs y botón Detener
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MegaTravelScrapingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isRunning, setIsRunning] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<'idle' | 'sync' | 'scraping' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({
        processed: 0,
        success: 0,
        errors: 0,
        deprecated: 0,
        newTours: 0,
        itineraryDays: 0,
        includesFound: 0,
        notIncludesFound: 0,
    });
    const [totalTours, setTotalTours] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef(false);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // Obtener total de tours al cargar
    useEffect(() => {
        fetch('/api/admin/megatravel?action=stats')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data?.stats?.totalPackages) {
                    setTotalTours(data.data.stats.totalPackages);
                }
            })
            .catch(() => setTotalTours(325)); // fallback
    }, []);

    const stopProcess = () => {
        abortRef.current = true;
        addLog('⛔ Deteniendo proceso... (terminando operación actual)');
    };

    // ==========================================
    // FASE 1: SINCRONIZACIÓN (descubrir tours nuevos + dar de baja)
    // ==========================================
    const runSync = async (): Promise<boolean> => {
        setCurrentPhase('sync');
        addLog('');
        addLog('═══════════════════════════════════════════');
        addLog('📡 FASE 1: SINCRONIZACIÓN CON MEGATRAVEL');
        addLog('═══════════════════════════════════════════');
        addLog('🔍 Descubriendo tours desde MegaTravel...');
        addLog('   Navegando categorías: Europa, Asia, Turquía, etc.');

        try {
            const response = await fetch('/api/admin/megatravel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'sync', force: true })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    addLog('❌ Error de autenticación. Redirigiendo al login...');
                    router.push('/login');
                    return false;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const found = data.data.packagesFound || 0;
                const synced = data.data.packagesSynced || 0;
                const failed = data.data.packagesFailed || 0;
                const duration = data.data.duration || '?';

                addLog(`✅ Sincronización completada en ${duration}`);
                addLog(`   📦 Tours descubiertos: ${found}`);
                addLog(`   ✅ Sincronizados: ${synced}`);
                if (failed > 0) addLog(`   ❌ Fallidos: ${failed}`);

                // Actualizar total de tours con lo descubierto
                if (found > 0) {
                    setTotalTours(found);
                    setStats(prev => ({ ...prev, newTours: Math.max(0, found - totalTours) }));
                    if (found > totalTours) {
                        addLog(`   🆕 Tours NUEVOS detectados: ${found - totalTours}`);
                    }
                }

                return true;
            } else {
                addLog(`❌ Error en sincronización: ${data.error?.message || 'Error desconocido'}`);
                return false;
            }
        } catch (error: any) {
            addLog(`❌ Error en sincronización: ${error.message}`);
            return false;
        }
    };

    // ==========================================
    // FASE 2: SCRAPING COMPLETO (actualizar detalles)
    // ==========================================
    const runScraping = async () => {
        setCurrentPhase('scraping');
        addLog('');
        addLog('═══════════════════════════════════════════');
        addLog('🔄 FASE 2: SCRAPING COMPLETO DE DETALLES');
        addLog('═══════════════════════════════════════════');

        const BATCH_SIZE = 5;
        const total = totalTours || 325;
        const totalBatches = Math.ceil(total / BATCH_SIZE);

        addLog(`📊 Total estimado: ${total} tours en ${totalBatches} batches de ${BATCH_SIZE}`);

        let offset = 0;
        let totalProcessed = 0;
        let totalSuccess = 0;
        let totalErrors = 0;
        let totalItinerary = 0;
        let totalIncludes = 0;
        let totalNotIncludes = 0;
        let totalDeprecated = 0;

        while (offset < total && !abortRef.current) {
            const batchNumber = Math.floor(offset / BATCH_SIZE) + 1;
            addLog(`📦 Batch ${batchNumber}/${totalBatches} (Tours ${offset + 1}-${Math.min(offset + BATCH_SIZE, total)})`);

            try {
                const response = await fetch('/api/admin/scrape-all', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ limit: BATCH_SIZE, offset })
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        addLog('❌ Error de autenticación. Redirigiendo al login...');
                        router.push('/login');
                        return;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    const batchSuccess = data.results.filter((r: any) => r.status === 'success').length;
                    const batchErrors = data.results.filter((r: any) => r.status === 'error').length;
                    const batchDeprecated = data.results.filter((r: any) => r.status === 'deprecated').length;

                    totalProcessed += data.processed;
                    totalSuccess += batchSuccess;
                    totalErrors += batchErrors;
                    totalDeprecated += batchDeprecated;

                    // Sumar métricas detalladas
                    data.results.forEach((r: any) => {
                        if (r.status === 'success') {
                            totalItinerary += r.itinerary || 0;
                            totalIncludes += r.includes || 0;
                            totalNotIncludes += r.not_includes || 0;
                        }
                    });

                    addLog(`✅ Batch ${batchNumber}: ${batchSuccess} OK, ${batchErrors} errores${batchDeprecated > 0 ? `, ${batchDeprecated} dados de baja` : ''}`);

                    // Mostrar resultados individuales
                    data.results.forEach((r: any) => {
                        if (r.status === 'success') {
                            addLog(`   ✓ ${r.mt_code}: $${r.price || 'N/A'} USD, ${r.itinerary || '?'} días, ${r.includes || 0}/${r.not_includes || 0} inc/no-inc`);
                        } else if (r.status === 'deprecated') {
                            addLog(`   🚫 ${r.mt_code}: DADO DE BAJA (ya no existe en MegaTravel)`);
                        } else {
                            addLog(`   ✗ ${r.mt_code}: ${r.error?.substring(0, 80) || 'Error'}`);
                        }
                    });

                    setStats(prev => ({
                        ...prev,
                        processed: totalProcessed,
                        success: totalSuccess,
                        errors: totalErrors,
                        deprecated: totalDeprecated,
                        itineraryDays: totalItinerary,
                        includesFound: totalIncludes,
                        notIncludesFound: totalNotIncludes,
                    }));

                } else {
                    addLog(`❌ Error en batch ${batchNumber}: ${data.error}`);
                    totalErrors += BATCH_SIZE;
                }

            } catch (error: any) {
                addLog(`❌ Error en batch ${batchNumber}: ${error.message}`);
                totalErrors += BATCH_SIZE;
            }

            offset += BATCH_SIZE;
            setProgress(Math.min(Math.round((offset / total) * 100), 100));

            // Pausa entre batches (5 segundos)
            if (offset < total && !abortRef.current) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (abortRef.current) {
            addLog('⛔ Scraping detenido por el usuario');
            addLog(`📊 Resumen parcial: ${totalProcessed} procesados, ${totalSuccess} exitosos, ${totalErrors} errores`);
        }
    };

    // ==========================================
    // FLUJO COMPLETO: Sync → Scraping
    // ==========================================
    const runFullProcess = async () => {
        abortRef.current = false;
        setIsRunning(true);
        setLogs([]);
        setProgress(0);
        setStats({ processed: 0, success: 0, errors: 0, deprecated: 0, newTours: 0, itineraryDays: 0, includesFound: 0, notIncludesFound: 0 });

        addLog('🚀 Iniciando proceso completo de actualización MegaTravel...');
        addLog(`📅 ${new Date().toLocaleString('es-MX')}`);

        // FASE 1: Sincronización
        if (!abortRef.current) {
            const syncOk = await runSync();
            if (!syncOk) {
                addLog('⚠️ La sincronización tuvo errores, pero continuaremos con el scraping...');
            }
        }

        // FASE 2: Scraping (si no se detuvo)
        if (!abortRef.current) {
            await runScraping();
        }

        // RESUMEN FINAL
        setCurrentPhase('done');
        addLog('');
        addLog('═══════════════════════════════════════════');
        addLog('🎉 PROCESO COMPLETO FINALIZADO');
        addLog('═══════════════════════════════════════════');
        addLog(`📊 Resumen Final:`);
        addLog(`   📦 Tours procesados: ${stats.processed}`);
        addLog(`   ✅ Exitosos: ${stats.success}`);
        addLog(`   ❌ Errores: ${stats.errors}`);
        addLog(`   🚫 Dados de baja: ${stats.deprecated}`);
        addLog(`   📅 Días de itinerario: ${stats.itineraryDays}`);
        addLog(`   ✅ Includes: ${stats.includesFound} | ❌ Not includes: ${stats.notIncludesFound}`);
        setIsRunning(false);
    };

    // Solo scraping (sin sync)
    const runScrapingOnly = async () => {
        abortRef.current = false;
        setIsRunning(true);
        setLogs([]);
        setProgress(0);
        setStats({ processed: 0, success: 0, errors: 0, deprecated: 0, newTours: 0, itineraryDays: 0, includesFound: 0, notIncludesFound: 0 });

        addLog('🔄 Iniciando solo Scraping (sin sincronización)...');
        addLog(`📅 ${new Date().toLocaleString('es-MX')}`);

        await runScraping();

        setCurrentPhase('done');
        addLog('');
        addLog('🎉 Scraping finalizado');
        setIsRunning(false);
    };

    const phaseLabel = currentPhase === 'sync' ? '📡 Sincronizando...'
        : currentPhase === 'scraping' ? '🔄 Scraping...'
            : currentPhase === 'done' ? '✅ Completado'
                : '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                🌍 MegaTravel — Sincronización y Scraping
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Descubrir tours nuevos, dar de baja los eliminados y actualizar información completa
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
                            >
                                ← Dashboard
                            </button>
                            {phaseLabel && (
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${currentPhase === 'sync' ? 'bg-blue-100 text-blue-700' :
                                        currentPhase === 'scraping' ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    {phaseLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Procesados</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exitosos</div>
                        <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Errores</div>
                        <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dados de Baja</div>
                        <div className="text-2xl font-bold text-gray-500">{stats.deprecated}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nuevos</div>
                        <div className="text-2xl font-bold text-cyan-600">{stats.newTours}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Días Itinerario</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.itineraryDays}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Includes</div>
                        <div className="text-2xl font-bold text-emerald-600">{stats.includesFound}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Not Includes</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.notIncludesFound}</div>
                    </div>
                </div>

                {/* Progress */}
                {isRunning && currentPhase === 'scraping' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Scraping</span>
                            <span className="text-sm font-medium text-blue-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {stats.processed} de ~{totalTours || 325} tours procesados
                        </div>
                    </div>
                )}

                {/* Sync progress indicator */}
                {isRunning && currentPhase === 'sync' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Sincronizando con MegaTravel...</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Descubriendo tours nuevos y verificando tours existentes</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={runFullProcess}
                            disabled={isRunning}
                            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-semibold text-white text-lg transition-all ${isRunning
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] shadow-lg shadow-blue-500/25'
                                }`}
                        >
                            {isRunning ? '⏳ Ejecutando...' : '🚀 Proceso Completo (Sync + Scraping)'}
                        </button>
                        <button
                            onClick={runScrapingOnly}
                            disabled={isRunning}
                            className={`py-4 px-6 rounded-xl font-semibold text-white transition-all ${isRunning
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:scale-[0.98] shadow-lg shadow-purple-500/25'
                                }`}
                        >
                            🔄 Solo Scraping
                        </button>
                        {isRunning && (
                            <button
                                onClick={stopProcess}
                                className="py-4 px-8 rounded-xl font-semibold text-white text-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-[0.98] shadow-lg shadow-red-500/25 transition-all"
                            >
                                ⛔ Detener
                            </button>
                        )}
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>📋 Proceso Completo:</strong> 1️⃣ Sincroniza con MegaTravel (descubre nuevos, da de baja eliminados) → 2️⃣ Scraping de detalles (itinerarios, precios, includes)
                            <br />
                            <strong>💡 Tip:</strong> Puedes detener en cualquier momento. Los datos ya procesados se conservan.
                        </p>
                    </div>
                </div>

                {/* Logs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">📋 Registro de Actividad</h2>
                        {logs.length > 0 && (
                            <button
                                onClick={() => setLogs([])}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                    <div className="bg-gray-950 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs leading-relaxed">
                        {logs.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                No hay actividad aún. Haz clic en &quot;Proceso Completo&quot; para comenzar.
                            </div>
                        ) : (
                            <>
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`mb-0.5 ${log.includes('═══') ? 'text-white font-bold' :
                                            log.includes('✅') || log.includes('✓') ? 'text-green-400' :
                                                log.includes('❌') || log.includes('✗') ? 'text-red-400' :
                                                    log.includes('🚫') ? 'text-gray-400' :
                                                        log.includes('🆕') ? 'text-cyan-400' :
                                                            log.includes('📦') ? 'text-blue-400' :
                                                                log.includes('📡') || log.includes('🔄') ? 'text-indigo-400' :
                                                                    log.includes('🚀') || log.includes('🎉') ? 'text-yellow-400' :
                                                                        log.includes('📊') || log.includes('📅') ? 'text-cyan-400' :
                                                                            log.includes('⛔') || log.includes('⚠️') ? 'text-orange-400' :
                                                                                'text-gray-400'
                                            }`}
                                    >
                                        {log}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

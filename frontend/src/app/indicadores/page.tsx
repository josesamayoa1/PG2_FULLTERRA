"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState, } from "react";
import styles from "./indicadores.module.css";
type UserProfile = {
    id: number;
    usuario: string;
    roles?: string[];
};
type UnitSummary = {
    id: number;
    codigo: string;
    tipo: string;
    marca: string;
    modelo: string;
    placaOSerie: string;
    estado: string;
    activo: boolean;
};
type Metrics = {
    viajes: number;
    kilometros: number;
    horasUso: number;
    galones: number;
    mantenimientos: number;
};
type UnitIndicators = Metrics & {
    unidad: UnitSummary;
};
type IndicatorsResponse = {
    periodo: {
        anio: number;
        mes: number;
        fechaInicio: string;
        fechaFin: string;
    };
    resumen: Metrics;
    indicadoresPorUnidad: UnitIndicators[];
};
type ComparisonResponse = {
    periodoActual: {
        anio: number;
        mes: number;
        fechaInicio: string;
        fechaFin: string;
    };
    periodoAnterior: {
        anio: number;
        mes: number;
        fechaInicio: string;
        fechaFin: string;
    };
    resumen: {
        actual: Metrics;
        anterior: Metrics;
        diferencia: Metrics;
    };
    comparativosPorUnidad: Array<{
        unidad: UnitSummary;
        actual: Metrics;
        anterior: Metrics;
        diferencia: Metrics;
    }>;
};
type AnnualMonth = Metrics & {
    mes: number;
};
type AnnualResponse = {
    periodo: {
        anio: number;
        fechaInicio: string;
        fechaFin: string;
    };
    resumen: Metrics;
    meses: AnnualMonth[];
    indicadoresPorUnidad: UnitIndicators[];
};
type ApiError = {
    message?: string | string[];
};
type ViewMode = "mensual" | "anual";
type MetricKey = keyof Metrics;
const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];
const shortMonthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
];
function getCurrentPeriod() {
    const now = new Date();
    return {
        anio: String(now.getFullYear()),
        mes: String(now.getMonth() + 1),
    };
}
function formatNumber(value: number) {
    return Number(value ?? 0).toLocaleString("es-GT", {
        maximumFractionDigits: 2,
    });
}
function formatDifference(value: number) {
    const number = Number(value ?? 0);
    if (number > 0) {
        return `+${formatNumber(number)}`;
    }
    return formatNumber(number);
}
function getBarHeight(value: number, maxValue: number) {
    const numericValue = Math.max(0, Number(value ?? 0));
    const numericMax = Math.max(0, Number(maxValue ?? 0));
    if (numericValue === 0 ||
        numericMax === 0) {
        return 0;
    }
    return Math.max(8, (numericValue /
        numericMax) * 100);
}
function getMonthlyVariation(currentValue: number, previousValue: number) {
    const current = Number(currentValue ?? 0);
    const previous = Number(previousValue ?? 0);
    if (previous === 0) {
        return null;
    }
    return ((current -
        previous) /
        previous) * 100;
}
function formatVariation(value: number | null) {
    if (value === null) {
        return "Sin base";
    }
    const rounded = Math.round(value * 10) / 10;
    if (rounded > 0) {
        return `+${formatNumber(rounded)}%`;
    }
    return `${formatNumber(rounded)}%`;
}
function getErrorMessage(data: ApiError, fallback: string) {
    if (Array.isArray(data.message)) {
        return data.message.join(", ");
    }
    if (typeof data.message ===
        "string" &&
        data.message.trim()) {
        return data.message;
    }
    return fallback;
}
function redirectExpiredSession() {
    localStorage.removeItem("fullterra_token");
    window.alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
    window.location.href =
        "/";
}
export default function IndicadoresPage() {
    const [checkingSession, setCheckingSession,] = useState(true);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [user, setUser,] = useState<UserProfile | null>(null);
    const [viewMode, setViewMode,] = useState<ViewMode>("mensual");
    const [indicators, setIndicators,] = useState<IndicatorsResponse | null>(null);
    const [comparison, setComparison,] = useState<ComparisonResponse | null>(null);
    const [annualIndicators, setAnnualIndicators,] = useState<AnnualResponse | null>(null);
    const [loadingData, setLoadingData,] = useState(true);
    const [searching, setSearching,] = useState(false);
    const [message, setMessage,] = useState("");
    const [error, setError,] = useState("");
    const [filters, setFilters,] = useState({
        anio: "",
        mes: "",
    });
    const apiUrl = process.env
        .NEXT_PUBLIC_API_URL ??
        "http://localhost:3000";
    const metricCharts = useMemo(() => [
        {
            key: "viajes" as MetricKey,
            label: "Viajes",
            barClass: styles.barViajes,
        },
        {
            key: "kilometros" as MetricKey,
            label: "Kilómetros",
            barClass: styles.barKilometros,
        },
        {
            key: "horasUso" as MetricKey,
            label: "Horas",
            barClass: styles.barHoras,
        },
        {
            key: "galones" as MetricKey,
            label: "Galones",
            barClass: styles.barGalones,
        },
        {
            key: "mantenimientos" as MetricKey,
            label: "Mantenimientos",
            barClass: styles.barMantenimientos,
        },
    ], []);
    const loadMonthlyIndicators = useCallback(async (token: string, anio: string, mes: string, showSuccessMessage = false) => {
        const params = new URLSearchParams({
            anio,
            mes,
        });
        const [indicatorsResponse, comparisonResponse,] = await Promise.all([
            fetch(`${apiUrl}/indicators?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            fetch(`${apiUrl}/indicators/monthly-comparison?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        ]);
        if (indicatorsResponse
            .status === 401 ||
            comparisonResponse
                .status === 401) {
            redirectExpiredSession();
            return false;
        }
        if (indicatorsResponse
            .status === 403 ||
            comparisonResponse
                .status === 403) {
            setError("No tienes permisos para consultar los indicadores.");
            return false;
        }
        if (!indicatorsResponse.ok) {
            const data: ApiError = await indicatorsResponse
                .json();
            setError(getErrorMessage(data, "No fue posible cargar los indicadores."));
            return false;
        }
        if (!comparisonResponse.ok) {
            const data: ApiError = await comparisonResponse
                .json();
            setError(getErrorMessage(data, "No fue posible cargar el comparativo mensual."));
            return false;
        }
        const [indicatorsData, comparisonData,] = await Promise.all([
            indicatorsResponse.json(),
            comparisonResponse.json(),
        ]);
        setIndicators(indicatorsData as IndicatorsResponse);
        setComparison(comparisonData as ComparisonResponse);
        if (showSuccessMessage) {
            setMessage("Indicadores mensuales consultados correctamente.");
        }
        return true;
    }, [apiUrl]);
    const loadAnnualIndicators = useCallback(async (token: string, anio: string, showSuccessMessage = false) => {
        const params = new URLSearchParams({
            anio,
        });
        const response = await fetch(`${apiUrl}/indicators/annual?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 401) {
            redirectExpiredSession();
            return false;
        }
        if (response.status === 403) {
            setError("No tienes permisos para consultar los indicadores anuales.");
            return false;
        }
        if (!response.ok) {
            const data: ApiError = await response.json();
            setError(getErrorMessage(data, "No fue posible cargar los indicadores anuales."));
            return false;
        }
        const data = await response.json();
        setAnnualIndicators(data as AnnualResponse);
        if (showSuccessMessage) {
            setMessage("Indicadores anuales consultados correctamente.");
        }
        return true;
    }, [apiUrl]);
    useEffect(() => {
        async function startPage() {
            const token = localStorage.getItem("fullterra_token");
            if (!token) {
                window.location.href =
                    "/";
                return;
            }
            try {
                const profileResponse = await fetch(`${apiUrl}/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (profileResponse
                    .status === 401) {
                    redirectExpiredSession();
                    return;
                }
                if (!profileResponse.ok) {
                    localStorage.removeItem("fullterra_token");
                    window.location.href =
                        "/";
                    return;
                }
                const profile: UserProfile = await profileResponse.json();
                const allowedRoles = [
                    "Administrador",
                    "Supervisor",
                ];
                const hasPermission = profile.roles?.some((role) => allowedRoles.includes(role));
                if (!hasPermission) {
                    window.alert("No tienes permisos para acceder al módulo de indicadores.");
                    if (profile.roles?.includes("Operador")) {
                        window.location.href =
                            "/operaciones";
                    }
                    else if (profile.roles?.includes("Encargado de combustible")) {
                        window.location.href =
                            "/combustible";
                    }
                    else if (profile.roles?.includes("Encargado de mantenimiento")) {
                        window.location.href =
                            "/mantenimiento";
                    }
                    else {
                        window.location.href =
                            "/";
                    }
                    return;
                }
                setUser(profile);
                const currentPeriod = getCurrentPeriod();
                setFilters(currentPeriod);
                await loadMonthlyIndicators(token, currentPeriod.anio, currentPeriod.mes);
            }
            catch (requestError) {
                console.error("Error al cargar indicadores:", requestError);
                setError("No fue posible cargar la información de indicadores.");
            }
            finally {
                setLoadingData(false);
                setCheckingSession(false);
            }
        }
        startPage();
    }, [
        apiUrl,
        loadMonthlyIndicators,
    ]);
    async function exportIndicatorsToExcel() {
        const isMonthly = viewMode === "mensual";
        const monthlyData = indicators;
        const comparisonData = comparison;
        const annualData = annualIndicators;
        if (searching || loadingData || (isMonthly ? !monthlyData || !comparisonData : !annualData)) {
            setError("Consulta los indicadores antes de exportarlos.");
            return;
        }
        try {
            setError("");
            const ExcelJS = (await import("exceljs")).default;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "FULLTERRA";
            workbook.created = new Date();
            const labels = ["Viajes", "Kilómetros", "Horas de uso", "Galones", "Mantenimientos"];
            const keys: MetricKey[] = ["viajes", "kilometros", "horasUso", "galones", "mantenimientos"];
            const headerColor = "FF292929";
            const accentColor = "FFF2C300";
            function addSheet(name: string, headers: string[], rows: (string | number)[][]) {
                const sheet = workbook.addWorksheet(name);
                sheet.addRow(headers);
                rows.forEach((row) => sheet.addRow(row));
                sheet.getRow(1).eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColor } };
                    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                    cell.alignment = { vertical: "middle" };
                });
                sheet.getRow(1).height = 24;
                sheet.columns.forEach((column) => {
                    column.width = Math.max(16, Math.min(34, (column.header?.length ?? 16) + 6));
                });
                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber > 1 && rowNumber % 2 === 0) {
                        row.eachCell((cell) => {
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F6F6" } };
                        });
                    }
                });
                sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
                sheet.views = [{ state: "frozen", ySplit: 1 }];
                return sheet;
            }
            let fileName: string;
            if (isMonthly && monthlyData && comparisonData) {
                const { anio, mes } = monthlyData.periodo;
                fileName = `FULLTERRA_Indicadores_${anio}_${String(mes).padStart(2, "0")}.xlsx`;
                addSheet("Resumen mensual", ["Indicador", "Actual", "Anterior", "Diferencia", "Variación (%)"],
                    keys.map((key, index) => {
                        const actual = Number(monthlyData.resumen[key] ?? 0);
                        const anterior = Number(comparisonData.resumen.anterior[key] ?? 0);
                        const variacion = getMonthlyVariation(actual, anterior);
                        return [labels[index], actual, anterior, actual - anterior, variacion === null ? "Sin base" : Math.round(variacion * 10) / 10];
                    }));
                addSheet("Indicadores por unidad", ["Unidad", "Marca", "Modelo", "Tipo", "Estado", ...labels],
                    monthlyData.indicadoresPorUnidad.map((item) => [
                        item.unidad.codigo, item.unidad.marca, item.unidad.modelo, item.unidad.tipo, item.unidad.estado,
                        ...keys.map((key) => Number(item[key] ?? 0)),
                    ]));
                addSheet("Variación por unidad", ["Unidad", ...labels],
                    comparisonData.comparativosPorUnidad.map((item) => [
                        item.unidad.codigo, ...keys.map((key) => Number(item.diferencia[key] ?? 0)),
                    ]));
            } else if (annualData) {
                const { anio } = annualData.periodo;
                fileName = `FULLTERRA_Indicadores_${anio}_Anual.xlsx`;
                addSheet("Resumen anual", ["Indicador", "Total anual"],
                    keys.map((key, index) => [labels[index], Number(annualData.resumen[key] ?? 0)]));
                addSheet("Evolución mensual", ["Mes", ...labels],
                    annualData.meses.map((item) => [
                        monthNames[item.mes - 1] ?? String(item.mes),
                        ...keys.map((key) => Number(item[key] ?? 0)),
                    ]));
                addSheet("Indicadores por unidad", ["Unidad", "Marca", "Modelo", "Tipo", "Estado", ...labels],
                    annualData.indicadoresPorUnidad.map((item) => [
                        item.unidad.codigo, item.unidad.marca, item.unidad.modelo, item.unidad.tipo, item.unidad.estado,
                        ...keys.map((key) => Number(item[key] ?? 0)),
                    ]));
            } else {
                return;
            }
            workbook.worksheets.forEach((sheet) => {
                sheet.getRow(1).border = { bottom: { style: "medium", color: { argb: accentColor } } };
            });
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer as BlobPart], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setMessage("Archivo Excel generado correctamente.");
        } catch (exportError) {
            console.error("Error al exportar indicadores:", exportError);
            setError("No fue posible generar el archivo Excel.");
        }
    }
    function handleLogout() {
        localStorage.removeItem("fullterra_token");
        window.location.href =
            "/";
    }
    async function handleModeChange(mode: ViewMode) {
        setViewMode(mode);
        setMessage("");
        setError("");
        if (mode === "anual" &&
            !annualIndicators) {
            const token = localStorage.getItem("fullterra_token");
            if (!token) {
                window.location.href =
                    "/";
                return;
            }
            const anio = Number(filters.anio);
            if (!Number.isInteger(anio) ||
                anio < 2000 ||
                anio > 2100) {
                return;
            }
            setSearching(true);
            try {
                await loadAnnualIndicators(token, String(anio));
            }
            catch (requestError) {
                console.error("Error al cargar indicadores anuales:", requestError);
                setError("No fue posible cargar los indicadores anuales.");
            }
            finally {
                setSearching(false);
            }
        }
    }
    async function consultIndicators(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const token = localStorage.getItem("fullterra_token");
        if (!token) {
            window.location.href =
                "/";
            return;
        }
        const anio = Number(filters.anio);
        const mes = Number(filters.mes);
        setMessage("");
        setError("");
        if (!Number.isInteger(anio) ||
            anio < 2000 ||
            anio > 2100) {
            setError("El año debe ser un número entero entre 2000 y 2100.");
            return;
        }
        if (viewMode ===
            "mensual" &&
            (!Number.isInteger(mes) ||
                mes < 1 ||
                mes > 12)) {
            setError("El mes debe ser un número entero entre 1 y 12.");
            return;
        }
        setSearching(true);
        try {
            if (viewMode ===
                "mensual") {
                await loadMonthlyIndicators(token, String(anio), String(mes), true);
            }
            else {
                await loadAnnualIndicators(token, String(anio), true);
            }
        }
        catch (requestError) {
            console.error("Error al consultar indicadores:", requestError);
            setError("No fue posible consultar los indicadores.");
        }
        finally {
            setSearching(false);
        }
    }
    const isAdministrator = user?.roles?.includes("Administrador") ?? false;
    const canViewManagement = user?.roles?.some((role) => role ===
        "Administrador" ||
        role ===
            "Supervisor") ?? false;
    const monthlySummary = indicators?.resumen ?? {
        viajes: 0,
        kilometros: 0,
        horasUso: 0,
        galones: 0,
        mantenimientos: 0,
    };
    const annualSummary = annualIndicators
        ?.resumen ?? {
        viajes: 0,
        kilometros: 0,
        horasUso: 0,
        galones: 0,
        mantenimientos: 0,
    };
    const currentPeriodLabel = indicators
        ? `${monthNames[indicators.periodo
            .mes - 1]} ${indicators.periodo
            .anio}`
        : "";
    const previousPeriodLabel = comparison
        ? `${monthNames[comparison
            .periodoAnterior
            .mes - 1]} ${comparison
            .periodoAnterior
            .anio}`
        : "";
    const annualPeriodLabel = annualIndicators
        ? `Año ${annualIndicators.periodo.anio}`
        : "";
    const annualMaxByMetric = useMemo(() => {
        const maxValues: Record<MetricKey, number> = {
            viajes: 0,
            kilometros: 0,
            horasUso: 0,
            galones: 0,
            mantenimientos: 0,
        };
        if (!annualIndicators) {
            return maxValues;
        }
        for (const metric of metricCharts) {
            maxValues[metric.key] = Math.max(0, ...annualIndicators
                .meses
                .map((month) => Number(month[metric.key] ?? 0)));
        }
        return maxValues;
    }, [
        annualIndicators,
        metricCharts,
    ]);
    function getVariationClass(value: number | null) {
        if (value === null) {
            return styles
                .summaryWheelNoBase;
        }
        if (value > 0) {
            return styles
                .summaryWheelPositive;
        }
        if (value < 0) {
            return styles
                .summaryWheelNegative;
        }
        return styles
            .summaryWheelNeutral;
    }
    if (checkingSession) {
        return (<main className={styles.loadingPage}>
        Cargando información...
      </main>);
    }
    return (<main className={styles.page}>
      {menuAbierto && <button type="button" className={styles.sidebarBackdrop} aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}
      <aside id="indicadores-sidebar" className={`${styles.sidebar} ${menuAbierto ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <Image src="/images/fullterra-logo.jpeg" alt="Logo de FULLTERRA" width={48} height={48} className={styles.logo} priority/>
          <span className={styles.brandName}>
            FULLTERRA
          </span>
          <button type="button" className={styles.closeMenuButton} aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)}>×</button>
        </div>
        <nav className={styles.navigation} onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuAbierto(false); }}> 
          {canViewManagement && (<Link href="/dashboard" className={styles.navItem}>
              <span className={styles.navIcon}>
                ▦
              </span>
              Dashboard
            </Link>)}
          {isAdministrator && (<Link href="/unidades" className={styles.navItem}>
              <span className={styles.navIcon}>
                ▣
              </span>
              Unidades
            </Link>)}
          <Link href="/operaciones" className={styles.navItem}>
            <span className={styles.navIcon}>
              ◉
            </span>
            Operaciones
          </Link>
          {canViewManagement && (<Link href="/combustible" className={styles.navItem}>
              <span className={styles.navIcon}>
                ◈
              </span>
              Combustible
            </Link>)}
          {canViewManagement && (<Link href="/mantenimiento" className={styles.navItem}>
              <span className={styles.navIcon}>
                ◇
              </span>
              Mantenimiento
            </Link>)}
          {canViewManagement && (<Link href="/alertas-mantenimiento" className={styles.navItem}>
              <span className={styles.navIcon}>!</span> Alertas
            </Link>)}
          <Link href="/trazabilidad" className={styles.navItem}>
            <span className={styles.navIcon}>
              ≡
            </span>
            Trazabilidad
          </Link>
          <Link href="/indicadores" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>
              ◫
            </span>
            Indicadores
          </Link>
          {canViewManagement && (
            <Link href="/auditoria" className={styles.navItem}>
              <span className={styles.navIcon}>☷</span>
              Auditoría
            </Link>
          )}
            {isAdministrator && (
                <Link href="/administracion-accesos" className={styles.navItem}>
                    <span className={styles.navIcon}>♙</span>
                    Gestión de usuarios
                </Link>
            )}
        </nav>
        <div className={styles.sidebarFooter}>
          Sistema de control
          operacional
        </div>
      </aside>
      <section className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <button type="button" className={styles.menuButton} aria-label="Abrir menú" aria-controls="indicadores-sidebar" aria-expanded={menuAbierto} onClick={() => setMenuAbierto(true)}>☰</button>
            <div>
            <p className={styles.sectionLabel}>
              CONTROL OPERACIONAL
            </p>
            <h1>
              Indicadores
            </h1>
            </div>
          </div>
          <div className={styles.userArea}>
            <div className={styles.userAvatar}>
              {user?.usuario
            ?.charAt(0)
            .toUpperCase() ??
            "U"}
            </div>
            <div className={styles.userInfo}>
              <strong>
                {user?.usuario ??
            "Usuario"}
              </strong>
              <span>
                {user?.roles?.join(", ") ??
            "Sin rol"}
              </span>
            </div>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>
        <div className={styles.workspace}>
          <section className={styles.formPanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>
                  PERÍODO
                </p>
                <h3>
                  Consultar indicadores
                </h3>
              </div>
              <span className={styles.periodBadge}>
                {viewMode ===
            "mensual"
            ? currentPeriodLabel ||
                "Mensual"
            : annualPeriodLabel ||
                "Anual"}
              </span>
            </div>
            <div className={styles.viewTabs}>
              <button type="button" className={viewMode ===
            "mensual"
            ? `${styles.viewTab} ${styles.viewTabActive}`
            : styles.viewTab} onClick={() => handleModeChange("mensual")}>
                Mensual
              </button>
              <button type="button" className={viewMode ===
            "anual"
            ? `${styles.viewTab} ${styles.viewTabActive}`
            : styles.viewTab} onClick={() => handleModeChange("anual")}>
                Anual
              </button>
            </div>
            <form className={viewMode ===
            "mensual"
            ? styles.form
            : `${styles.form} ${styles.formAnnual}`} onSubmit={consultIndicators}>
              <div className={styles.field}>
                <label htmlFor="indicator-year">
                  Año
                </label>
                <input id="indicator-year" type="number" min="2000" max="2100" step="1" required value={filters.anio} onChange={(event) => setFilters({
            ...filters,
            anio: event.target
                .value,
        })}/>
              </div>
              {viewMode ===
            "mensual" && (<div className={styles.field}>
                  <label htmlFor="indicator-month">
                    Mes
                  </label>
                  <select id="indicator-month" required value={filters.mes} onChange={(event) => setFilters({
                ...filters,
                mes: event.target
                    .value,
            })}>
                    {monthNames.map((month, index) => (<option key={month} value={index +
                    1}>
                          {month}
                        </option>))}
                  </select>
                </div>)}
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={searching}>
                  {searching
            ? "Consultando..."
            : viewMode ===
                "mensual"
                ? "Consultar mes"
                : "Consultar año"}
                </button>
              </div>
            </form>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={exportIndicatorsToExcel}
                  disabled={searching || loadingData || (viewMode === "mensual" ? !indicators || !comparison : !annualIndicators)}
                >
                  Exportar a Excel
                </button>
              </div>
            {message && (<div className={styles.successMessage}>
                {message}
              </div>)}
            {error && (<div className={styles.errorMessage}>
                {error}
              </div>)}
          </section>
          {viewMode ===
            "mensual" ? (<>
              <section className={styles.intro}>
                <div className={styles.introText}>
                  <p className={styles.introLabel}>
                    RESUMEN DEL
                    PERÍODO
                  </p>
                  <h2>
                    Indicadores
                    operacionales
                  </h2>
                  <p>
                    Consulta los
                    resultados
                    consolidados del
                    período
                    seleccionado y
                    compáralos con el
                    mes anterior.
                  </p>
                </div>
                <div className={styles.summary}>
                  {metricCharts.map((metric) => {
                const currentValue = Number(monthlySummary[metric
                    .key] ?? 0);
                const previousValue = Number(comparison
                    ?.resumen
                    .anterior[metric
                    .key] ?? 0);
                const variation = getMonthlyVariation(currentValue, previousValue);
                const variationMagnitude = variation ===
                    null
                    ? 0
                    : Math.min(Math.abs(variation), 100);
                const wheelDegrees = variationMagnitude *
                    3.6;
                const variationClass = getVariationClass(variation);
                return (<div key={metric.key} className={styles.summaryCard}>
                          <div className={styles.summaryInfo}>
                            <span>
                                {metric.key ===
                        "mantenimientos"
                        ? "Mantenim."
                        : metric.label}
                            </span>
                            <strong>
                                {formatNumber(currentValue)}
                            </strong>
                            <small>
                                {comparison
                        ? `Anterior: ${formatNumber(previousValue)}`
                        : "Sin comparativo"}
                            </small>
                            </div>
                          <div className={`${styles.summaryWheel} ${variationClass}`} style={{
                        background: `conic-gradient(currentColor 0deg ${wheelDegrees}deg, #e6e3d9 ${wheelDegrees}deg 360deg)`,
                    }} title={variation ===
                        null
                        ? "No existe una base mensual anterior válida para calcular variación."
                        : `Variación respecto al mes anterior: ${formatVariation(variation)}`}>
                            <div className={styles.summaryWheelInner}>
                              <strong>
                                {formatVariation(variation)}
                              </strong>
                              <span>
                                variación
                              </span>
                            </div>
                          </div>
                        </div>);
            })}
                </div>
              </section>
              <section className={styles.listPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.panelLabel}>
                      COMPARATIVO VISUAL
                    </p>
                    <h3>
                      Comparación mensual
                    </h3>
                  </div>
                  {comparison && (<span className={styles.counter}>
                      {currentPeriodLabel}
                      {" vs "}
                      {previousPeriodLabel}
                    </span>)}
                </div>
                {loadingData ? (<div className={styles.emptyState}>
                    Cargando
                    indicadores...
                  </div>) : !comparison ? (<div className={styles.emptyState}>
                    No hay información
                    comparativa
                    disponible.
                  </div>) : (<div className={styles.chartGrid}>
                    {metricCharts.map((metric) => {
                    const currentValue = Number(comparison
                        .resumen
                        .actual[metric
                        .key] ?? 0);
                    const previousValue = Number(comparison
                        .resumen
                        .anterior[metric
                        .key] ?? 0);
                    const difference = Number(comparison
                        .resumen
                        .diferencia[metric
                        .key] ?? 0);
                    const maxValue = Math.max(currentValue, previousValue);
                    return (<article key={metric.key} className={styles.chartCard}>
                            <div className={styles.chartCardHeader}>
                              <div>
                                <span className={styles.chartEyebrow}>
                                  INDICADOR
                                </span>
                                <h4>
                                  {metric.label}
                                </h4>
                              </div>
                              <span className={difference >
                            0
                            ? styles.positiveDifference
                            : difference <
                                0
                                ? styles.negativeDifference
                                : styles.neutralDifference}>
                                {formatDifference(difference)}
                              </span>
                            </div>
                            <div className={styles.chartArea}>
                              <div className={styles.barColumn}>
                                <div className={styles.barValue}>
                                  {formatNumber(currentValue)}
                                </div>
                                <div className={styles.barTrack}>
                                  <div className={`${styles.barFill} ${metric.barClass}`} style={{
                            height: `${getBarHeight(currentValue, maxValue)}%`,
                        }}/>
                                </div>
                                <span className={styles.barLabel}>
                                  Actual
                                </span>
                              </div>
                              <div className={styles.barColumn}>
                                <div className={styles.barValue}>
                                  {formatNumber(previousValue)}
                                </div>
                                <div className={styles.barTrack}>
                                  <div className={`${styles.barFill} ${metric.barClass} ${styles.barPrevious}`} style={{
                            height: `${getBarHeight(previousValue, maxValue)}%`,
                        }}/>
                                </div>
                                <span className={styles.barLabel}>
                                  Anterior
                                </span>
                              </div>
                            </div>
                            <div className={styles.chartFooter}>
                              <span>
                                {currentPeriodLabel}
                              </span>
                              <span>
                                {previousPeriodLabel}
                              </span>
                            </div>
                          </article>);
                })}
                  </div>)}
              </section>
              <section className={styles.listPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.panelLabel}>
                      UNIDADES
                    </p>
                    <h3>
                      Indicadores por
                      unidad
                    </h3>
                  </div>
                  <span className={styles.counter}>
                    {indicators
                ?.indicadoresPorUnidad
                .length ??
                0}{" "}
                    unidades
                  </span>
                </div>
                {loadingData ? (<div className={styles.emptyState}>
                    Cargando
                    indicadores...
                  </div>) : !indicators ||
                indicators
                    .indicadoresPorUnidad
                    .length ===
                    0 ? (<div className={styles.emptyState}>
                    No existen
                    indicadores para
                    el período
                    seleccionado.
                  </div>) : (<div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>
                            Unidad
                          </th>
                          <th>
                            Tipo
                          </th>
                          <th>
                            Estado
                          </th>
                          <th>
                            Viajes
                          </th>
                          <th>
                            Km
                          </th>
                          <th>
                            Horas
                          </th>
                          <th>
                            Galones
                          </th>
                          <th>
                            Mantenimientos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {indicators
                    .indicadoresPorUnidad
                    .map((indicator) => (<tr key={indicator
                        .unidad
                        .id}>
                                <td>
                                  <strong>
                                    {indicator
                        .unidad
                        .codigo}
                                  </strong>
                                  <br />
                                  {indicator
                        .unidad
                        .marca}{" "}
                                  {indicator
                        .unidad
                        .modelo}
                                </td>
                                <td>
                                  {indicator
                        .unidad
                        .tipo}
                                </td>
                                <td>
                                  {indicator
                        .unidad
                        .estado}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .viajes)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .kilometros)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .horasUso)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .galones)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .mantenimientos)}
                                </td>
                              </tr>))}
                      </tbody>
                    </table>
                  </div>)}
              </section>
              <section className={styles.listPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.panelLabel}>
                      COMPARACIÓN POR
                      UNIDAD
                    </p>
                    <h3>
                      Variación frente
                      al mes anterior
                    </h3>
                  </div>
                  <span className={styles.counter}>
                    {comparison
                ?.comparativosPorUnidad
                .length ??
                0}{" "}
                    unidades
                  </span>
                </div>
                {loadingData ? (<div className={styles.emptyState}>
                    Cargando
                    comparativo...
                  </div>) : !comparison ||
                comparison
                    .comparativosPorUnidad
                    .length ===
                    0 ? (<div className={styles.emptyState}>
                    No existen datos
                    comparativos por
                    unidad.
                  </div>) : (<div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>
                            Unidad
                          </th>
                          <th>
                            Viajes
                          </th>
                          <th>
                            Km
                          </th>
                          <th>
                            Horas
                          </th>
                          <th>
                            Galones
                          </th>
                          <th>
                            Mantenimientos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison
                    .comparativosPorUnidad
                    .map((item) => (<tr key={item
                        .unidad
                        .id}>
                                <td>
                                  <strong>
                                    {item
                        .unidad
                        .codigo}
                                  </strong>
                                  <br />
                                  Diferencia
                                </td>
                                <td>
                                  {formatDifference(item
                        .diferencia
                        .viajes)}
                                </td>
                                <td>
                                  {formatDifference(item
                        .diferencia
                        .kilometros)}
                                </td>
                                <td>
                                  {formatDifference(item
                        .diferencia
                        .horasUso)}
                                </td>
                                <td>
                                  {formatDifference(item
                        .diferencia
                        .galones)}
                                </td>
                                <td>
                                  {formatDifference(item
                        .diferencia
                        .mantenimientos)}
                                </td>
                              </tr>))}
                      </tbody>
                    </table>
                  </div>)}
              </section>
            </>) : (<>
              <section className={styles.intro}>
                <div className={styles.introText}>
                  <p className={styles.introLabel}>
                    RESUMEN ANUAL
                  </p>
                  <h2>
                    Indicadores del año
                  </h2>
                  <p>
                    Consulta los
                    resultados
                    acumulados del año
                    seleccionado y su
                    evolución de enero
                    a diciembre.
                  </p>
                </div>
                <div className={styles.annualSummary}>
                  {metricCharts.map((metric) => (<div key={metric.key} className={styles.annualSummaryCard}>
                        <span>
                          {metric.label}
                        </span>
                        <strong>
                          {formatNumber(Number(annualSummary[metric
                    .key] ??
                    0))}
                        </strong>
                        <small>
                          Total anual
                        </small>
                      </div>))}
                </div>
              </section>
              <section className={styles.listPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.panelLabel}>
                      EVOLUCIÓN ANUAL
                    </p>
                    <h3>
                      Comportamiento
                      por mes
                    </h3>
                  </div>
                  <span className={styles.counter}>
                    {annualPeriodLabel ||
                "Año"}
                  </span>
                </div>
                {searching &&
                !annualIndicators ? (<div className={styles.emptyState}>
                    Cargando
                    indicadores
                    anuales...
                  </div>) : !annualIndicators ? (<div className={styles.emptyState}>
                    Consulta un año
                    para visualizar
                    su evolución
                    mensual.
                  </div>) : (<div className={styles.annualChartsGrid}>
                    {metricCharts.map((metric, metricIndex) => (<article key={metric.key} className={metricIndex ===
                        metricCharts.length -
                            1
                        ? `${styles.annualChartCard} ${styles.annualChartCardWide}`
                        : styles.annualChartCard}>
                          <div className={styles.annualChartHeader}>
                            <div>
                              <span className={styles.chartEyebrow}>
                                INDICADOR
                                ANUAL
                              </span>
                              <h4>
                                {metric.label}
                              </h4>
                            </div>
                            <strong className={styles.annualTotalBadge}>
                              Total:{" "}
                              {formatNumber(Number(annualSummary[metric
                        .key] ??
                        0))}
                            </strong>
                          </div>
                          <div className={styles.annualBarsArea}>
                            {annualIndicators
                        .meses
                        .map((month) => {
                        const value = Number(month[metric
                            .key] ??
                            0);
                        return (<div key={month.mes} className={styles.annualBarColumn}>
                                      <span className={styles.annualBarValue}>
                                        {value ===
                                0
                                ? "0"
                                : formatNumber(value)}
                                      </span>
                                      <div className={styles.annualBarTrack}>
                                        <div className={`${styles.annualBarFill} ${metric.barClass}`} style={{
                                height: `${getBarHeight(value, annualMaxByMetric[metric
                                    .key])}%`,
                            }}/>
                                      </div>
                                      <span className={styles.annualBarLabel}>
                                        {shortMonthNames[month
                                .mes -
                                1]}
                                      </span>
                                    </div>);
                    })}
                          </div>
                        </article>))}
                  </div>)}
              </section>
              <section className={styles.listPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.panelLabel}>
                      RESUMEN MENSUAL
                    </p>
                    <h3>
                      Detalle de enero
                      a diciembre
                    </h3>
                  </div>
                  <span className={styles.counter}>
                    12 meses
                  </span>
                </div>
                {!annualIndicators ? (<div className={styles.emptyState}>
                    No hay datos
                    anuales cargados.
                  </div>) : (<div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>
                            Mes
                          </th>
                          <th>
                            Viajes
                          </th>
                          <th>
                            Km
                          </th>
                          <th>
                            Horas
                          </th>
                          <th>
                            Galones
                          </th>
                          <th>
                            Mantenimientos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {annualIndicators
                    .meses
                    .map((month) => (<tr key={month.mes}>
                                <td>
                                  <strong>
                                    {monthNames[month
                        .mes -
                        1]}
                                  </strong>
                                </td>
                                <td>
                                  {formatNumber(month.viajes)}
                                </td>
                                <td>
                                  {formatNumber(month.kilometros)}
                                </td>
                                <td>
                                  {formatNumber(month.horasUso)}
                                </td>
                                <td>
                                  {formatNumber(month.galones)}
                                </td>
                                <td>
                                  {formatNumber(month.mantenimientos)}
                                </td>
                              </tr>))}
                      </tbody>
                    </table>
                  </div>)}
              </section>
              <section className={styles.listPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.panelLabel}>
                      UNIDADES
                    </p>
                    <h3>
                      Totales anuales
                      por unidad
                    </h3>
                  </div>
                  <span className={styles.counter}>
                    {annualIndicators
                ?.indicadoresPorUnidad
                .length ??
                0}{" "}
                    unidades
                  </span>
                </div>
                {!annualIndicators ||
                annualIndicators
                    .indicadoresPorUnidad
                    .length ===
                    0 ? (<div className={styles.emptyState}>
                    No existen
                    indicadores
                    anuales por
                    unidad.
                  </div>) : (<div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>
                            Unidad
                          </th>
                          <th>
                            Tipo
                          </th>
                          <th>
                            Estado
                          </th>
                          <th>
                            Viajes
                          </th>
                          <th>
                            Km
                          </th>
                          <th>
                            Horas
                          </th>
                          <th>
                            Galones
                          </th>
                          <th>
                            Mantenimientos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {annualIndicators
                    .indicadoresPorUnidad
                    .map((indicator) => (<tr key={indicator
                        .unidad
                        .id}>
                                <td>
                                  <strong>
                                    {indicator
                        .unidad
                        .codigo}
                                  </strong>
                                  <br />
                                  {indicator
                        .unidad
                        .marca}{" "}
                                  {indicator
                        .unidad
                        .modelo}
                                </td>
                                <td>
                                  {indicator
                        .unidad
                        .tipo}
                                </td>
                                <td>
                                  {indicator
                        .unidad
                        .estado}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .viajes)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .kilometros)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .horasUso)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .galones)}
                                </td>
                                <td>
                                  {formatNumber(indicator
                        .mantenimientos)}
                                </td>
                              </tr>))}
                      </tbody>
                    </table>
                  </div>)}
              </section>
            </>)}
        </div>
      </section>
    </main>);
}

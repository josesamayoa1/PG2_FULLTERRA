"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState, } from "react";
import styles from "./trazabilidad.module.css";
type UserProfile = {
    id: number;
    usuario: string;
    roles?: string[];
};
type Unit = {
    id: number;
    codigo: string;
    tipo: string;
    marca: string;
    modelo: string;
    placaOSerie: string;
    estado: string;
    activo: boolean;
};
type Employee = {
    id: number;
    nombres: string;
    puesto: string;
    activo: boolean;
};
type TraceabilityRecord = {
    id: number;
    tipoOperacion: "VIAJE" | "HORAS_MAQUINARIA";
    fechaOperacion: string;
    viajes: number | null;
    kilometros: number | null;
    horasUso: number | null;
    observaciones: string | null;
    estado: string;
    unidad: {
        id: number;
        codigo: string;
        tipo: string;
        marca: string;
        modelo: string;
    };
    empleado: {
        id: number;
        nombres: string;
        puesto: string;
    };
    actividad: {
        id: number;
        nombre: string;
        categoria: string;
    };
};
type ApiError = {
    message?: string | string[];
};
const initialFilters = {
    unidadId: "",
    empleadoId: "",
    fecha: "",
    fechaInicio: "",
    fechaFin: "",
};
function formatearFecha(fecha: string) {
    if (!fecha) {
        return "—";
    }
    const partes = fecha.split("-");
    if (partes.length !== 3) {
        return fecha;
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
function obtenerMensajeError(data: ApiError, fallback: string) {
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
function redirigirSesionExpirada() {
    localStorage.removeItem("fullterra_token");
    window.alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
    window.location.href = "/";
}
export default function TrazabilidadPage() {
    const [checkingSession, setCheckingSession,] = useState(true);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [employees, setEmployees,] = useState<Employee[]>([]);
    const [records, setRecords,] = useState<TraceabilityRecord[]>([]);
    const [loadingData, setLoadingData,] = useState(true);
    const [searching, setSearching,] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [filters, setFilters,] = useState(initialFilters);
    const apiUrl = process.env
        .NEXT_PUBLIC_API_URL ??
        "http://localhost:3000";
    const cargarDatosIniciales = useCallback(async (token: string) => {
        setLoadingData(true);
        setError("");
        try {
            const respuestas = await Promise.all([
                fetch(`${apiUrl}/units`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${apiUrl}/employees`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${apiUrl}/traceability`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);
            if (respuestas.some((response) => response.status ===
                401)) {
                redirigirSesionExpirada();
                return;
            }
            if (respuestas.some((response) => response.status ===
                403)) {
                setError("No tienes permisos para acceder al módulo de trazabilidad.");
                return;
            }
            if (respuestas.some((response) => !response.ok)) {
                throw new Error("No fue posible cargar la información de trazabilidad.");
            }
            const [unitsData, employeesData, traceabilityData,] = await Promise.all([
                respuestas[0].json(),
                respuestas[1].json(),
                respuestas[2].json(),
            ]);
            setUnits(unitsData as Unit[]);
            setEmployees(employeesData as Employee[]);
            setRecords(traceabilityData as TraceabilityRecord[]);
        }
        catch (requestError) {
            console.error("Error al cargar trazabilidad:", requestError);
            setError("No fue posible cargar la información de trazabilidad.");
        }
        finally {
            setLoadingData(false);
        }
    }, [apiUrl]);
    useEffect(() => {
        async function iniciarPagina() {
            const token = localStorage.getItem("fullterra_token");
            if (!token) {
                window.location.href = "/";
                return;
            }
            try {
                const response = await fetch(`${apiUrl}/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status === 401) {
                    redirigirSesionExpirada();
                    return;
                }
                if (!response.ok) {
                    localStorage.removeItem("fullterra_token");
                    window.location.href =
                        "/";
                    return;
                }
                const profile: UserProfile = await response.json();
                const rolesPermitidos = [
                    "Administrador",
                    "Supervisor",
                    "Operador",
                ];
                const tienePermiso = profile.roles?.some((role) => rolesPermitidos.includes(role));
                if (!tienePermiso) {
                    window.alert("No tienes permisos para acceder al módulo de trazabilidad.");
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
                await cargarDatosIniciales(token);
            }
            catch (requestError) {
                console.error("Error al validar sesión:", requestError);
                localStorage.removeItem("fullterra_token");
                window.location.href = "/";
            }
            finally {
                setCheckingSession(false);
            }
        }
        iniciarPagina();
    }, [
        apiUrl,
        cargarDatosIniciales,
    ]);
    function handleLogout() {
        localStorage.removeItem("fullterra_token");
        window.location.href = "/";
    }
    async function consultarTrazabilidad(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const token = localStorage.getItem("fullterra_token");
        if (!token) {
            window.location.href = "/";
            return;
        }
        setSearching(true);
        setMessage("");
        setError("");
        try {
            if (filters.fecha &&
                (filters.fechaInicio ||
                    filters.fechaFin)) {
                setError("No puedes combinar una fecha específica con un rango de fechas.");
                return;
            }
            if ((filters.fechaInicio &&
                !filters.fechaFin) ||
                (!filters.fechaInicio &&
                    filters.fechaFin)) {
                setError("Para consultar por período debes indicar fecha inicial y fecha final.");
                return;
            }
            if (filters.fechaInicio &&
                filters.fechaFin &&
                filters.fechaInicio >
                    filters.fechaFin) {
                setError("La fecha inicial no puede ser posterior a la fecha final.");
                return;
            }
            const params = new URLSearchParams();
            if (filters.unidadId) {
                params.set("unidadId", filters.unidadId);
            }
            if (filters.empleadoId) {
                params.set("empleadoId", filters.empleadoId);
            }
            if (filters.fecha) {
                params.set("fecha", filters.fecha);
            }
            if (filters.fechaInicio &&
                filters.fechaFin) {
                params.set("fechaInicio", filters.fechaInicio);
                params.set("fechaFin", filters.fechaFin);
            }
            const query = params.toString();
            const endpoint = query
                ? `${apiUrl}/traceability?${query}`
                : `${apiUrl}/traceability`;
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 401) {
                redirigirSesionExpirada();
                return;
            }
            if (response.status === 403) {
                setError("No tienes permisos para consultar la trazabilidad.");
                return;
            }
            if (!response.ok) {
                const data: ApiError = await response.json();
                setError(obtenerMensajeError(data, "No fue posible consultar la trazabilidad."));
                return;
            }
            const data: TraceabilityRecord[] = await response.json();
            setRecords(data);
            setMessage("Consulta realizada correctamente.");
        }
        catch (requestError) {
            console.error("Error al consultar trazabilidad:", requestError);
            setError("No fue posible consultar la trazabilidad.");
        }
        finally {
            setSearching(false);
        }
    }
    async function limpiarFiltros() {
        const token = localStorage.getItem("fullterra_token");
        setFilters(initialFilters);
        setMessage("");
        setError("");
        if (!token) {
            window.location.href = "/";
            return;
        }
        setSearching(true);
        try {
            const response = await fetch(`${apiUrl}/traceability`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 401) {
                redirigirSesionExpirada();
                return;
            }
            if (!response.ok) {
                throw new Error("No fue posible limpiar los filtros.");
            }
            const data: TraceabilityRecord[] = await response.json();
            setRecords(data);
        }
        catch (requestError) {
            console.error("Error al limpiar filtros:", requestError);
            setError("No fue posible cargar nuevamente la trazabilidad.");
        }
        finally {
            setSearching(false);
        }
    }
    const totalRegistros = records.length;
    const totalViajes = records.reduce((total, record) => total +
        Number(record.viajes ?? 0), 0);
    const totalKilometros = records.reduce((total, record) => total +
        Number(record.kilometros ??
            0), 0);
    const totalHoras = records.reduce((total, record) => total +
        Number(record.horasUso ?? 0), 0);
    const esAdministrador = user?.roles?.includes("Administrador") ?? false;
    const esSupervisor = user?.roles?.includes("Supervisor") ?? false;
    const puedeVerGestion = esAdministrador ||
        esSupervisor;
    if (checkingSession) {
        return (<main className={styles.loadingPage}>
        Cargando información...
      </main>);
    }
    return (<main className={styles.page}>
      {menuAbierto && <button type="button" className={styles.sidebarBackdrop} aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}
      <aside className={`${styles.sidebar} ${menuAbierto ? styles.sidebarOpen : ""}`}>
        <button type="button" className={styles.sidebarClose} aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)}>×</button>
        <div className={styles.brand}>
          <Image src="/images/fullterra-logo.jpeg" alt="Logo de FULLTERRA" width={48} height={48} className={styles.logo} priority/>
          <span className={styles.brandName}>
            FULLTERRA
          </span>
        </div>
        <nav className={styles.navigation} onClick={() => setMenuAbierto(false)}>
          {puedeVerGestion && (<Link href="/dashboard" className={styles.navItem}>
                <span className={styles.navIcon}>
                ▦
                </span>
                Dashboard
            </Link>)}
          {esAdministrador && (<Link href="/unidades" className={styles.navItem}>
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
          {puedeVerGestion && (<Link href="/combustible" className={styles.navItem}>
                <span className={styles.navIcon}>
                ◈
                </span>
                Combustible
            </Link>)}
          {puedeVerGestion && (<Link href="/mantenimiento" className={styles.navItem}>
                <span className={styles.navIcon}>
                ◇
                </span>
                Mantenimiento
            </Link>)}
          {puedeVerGestion && (<Link href="/alertas-mantenimiento" className={styles.navItem}><span className={styles.navIcon}>!</span>Alertas</Link>)}
            <Link href="/trazabilidad" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>
              ≡
            </span>
            Trazabilidad
          </Link>
          {puedeVerGestion && (<Link href="/indicadores" className={styles.navItem}>
            <span className={styles.navIcon}>
                ◫
            </span>
            Indicadores
            </Link>)}
            {puedeVerGestion && (
              <Link href="/auditoria" className={styles.navItem}>
                <span className={styles.navIcon}>☷</span>
                Auditoría
              </Link>
            )}
            {esAdministrador && (
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
            <button type="button" className={styles.menuButton} aria-label="Abrir menú" aria-expanded={menuAbierto} onClick={() => setMenuAbierto(true)}>☰</button>
            <div>
            <p className={styles.sectionLabel}>
              CONTROL OPERACIONAL
            </p>
            <h1>
              Trazabilidad
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
                  FILTROS
                </p>
                <h3>
                  Consultar trazabilidad
                </h3>
              </div>
            </div>
            <form className={styles.form} onSubmit={consultarTrazabilidad}>
              <div className={styles.field}>
                <label htmlFor="trace-unit">
                  Unidad
                </label>
                <select id="trace-unit" value={filters.unidadId} onChange={(event) => setFilters({
            ...filters,
            unidadId: event.target
                .value,
        })}>
                  <option value="">
                    Todas las unidades
                  </option>
                  {units.map((unit) => (<option key={unit.id} value={unit.id}>
                        {unit.codigo}{" "}
                        -{" "}
                        {unit.tipo}{" "}
                        -{" "}
                        {unit.marca}{" "}
                        {unit.modelo}
                      </option>))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="trace-employee">
                  Empleado
                </label>
                <select id="trace-employee" value={filters.empleadoId} onChange={(event) => setFilters({
            ...filters,
            empleadoId: event.target
                .value,
        })}>
                  <option value="">
                    Todos los empleados
                  </option>
                  {employees.map((employee) => (<option key={employee.id} value={employee.id}>
                        {employee.nombres}{" "}
                        -{" "}
                        {employee.puesto}
                      </option>))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="trace-date">
                  Fecha específica
                </label>
                <input id="trace-date" type="date" value={filters.fecha} disabled={Boolean(filters.fechaInicio ||
            filters.fechaFin)} onChange={(event) => setFilters({
            ...filters,
            fecha: event.target
                .value,
            fechaInicio: "",
            fechaFin: "",
        })}/>
              </div>
              <div className={styles.field}>
                <label htmlFor="trace-start">
                  Fecha inicial
                </label>
                <input id="trace-start" type="date" value={filters.fechaInicio} disabled={Boolean(filters.fecha)} onChange={(event) => setFilters({
            ...filters,
            fechaInicio: event.target
                .value,
            fecha: "",
        })}/>
              </div>
              <div className={styles.field}>
                <label htmlFor="trace-end">
                  Fecha final
                </label>
                <input id="trace-end" type="date" value={filters.fechaFin} disabled={Boolean(filters.fecha)} onChange={(event) => setFilters({
            ...filters,
            fechaFin: event.target
                .value,
            fecha: "",
        })}/>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={searching}>
                  {searching
            ? "Consultando..."
            : "Consultar"}
                </button>
                <button type="button" className={styles.cancelButton} disabled={searching} onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              </div>
            </form>
            {message && (<div className={styles.successMessage}>
                {message}
              </div>)}
            {error && (<div className={styles.errorMessage}>
                {error}
              </div>)}
          </section>
          <section className={styles.intro}>
            <div>
              <p className={styles.introLabel}>
                SEGUIMIENTO OPERACIONAL
              </p>
              <h2>
                Trazabilidad de
                operaciones
              </h2>
              <p>
                Consulta la relación entre
                unidades, empleados y
                actividades realizadas,
                utilizando filtros por
                unidad, colaborador y
                período.
              </p>
            </div>
            <div className={styles.summary}>
              <div>
                <span>
                  Registros
                </span>
                <strong>
                  {totalRegistros}
                </strong>
              </div>
              <div>
                <span>
                  Viajes
                </span>
                <strong>
                  {totalViajes.toLocaleString("es-GT", {
            maximumFractionDigits: 2,
        })}
                </strong>
              </div>
              <div>
                <span>
                  Kilómetros
                </span>
                <strong>
                  {totalKilometros.toLocaleString("es-GT", {
            maximumFractionDigits: 2,
        })}
                </strong>
              </div>
              <div>
                <span>
                  Horas
                </span>
                <strong>
                  {totalHoras.toLocaleString("es-GT", {
            maximumFractionDigits: 2,
        })}
                </strong>
              </div>
            </div>
          </section>
          <section className={styles.listPanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>
                  RESULTADOS
                </p>
                <h3>
                  Historial operacional
                </h3>
              </div>
              <span className={styles.counter}>
                {records.length}{" "}
                registros
              </span>
            </div>
            {loadingData ? (<div className={styles.emptyState}>
                Cargando información de
                trazabilidad...
              </div>) : records.length ===
            0 ? (<div className={styles.emptyState}>
                No existen operaciones
                que coincidan con los
                filtros seleccionados.
              </div>) : (<div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        Fecha
                      </th>
                      <th>
                        Operación
                      </th>
                      <th>
                        Unidad
                      </th>
                      <th>
                        Empleado
                      </th>
                      <th>
                        Actividad
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
                        Observaciones
                      </th>
                      <th>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (<tr key={record.id}>
                          <td>
                            {formatearFecha(record.fechaOperacion)}
                          </td>
                          <td>
                            {record.tipoOperacion ===
                    "VIAJE"
                    ? "Viaje"
                    : "Horas maquinaria"}
                          </td>
                          <td>
                            <strong>
                              {record
                    .unidad
                    .codigo}
                            </strong>
                            <br />
                            {record
                    .unidad
                    .tipo}
                          </td>
                          <td>
                            {record
                    .empleado
                    .nombres}
                            <br />
                            {record
                    .empleado
                    .puesto}
                          </td>
                          <td>
                            {record
                    .actividad
                    .nombre}
                            <br />
                            {record
                    .actividad
                    .categoria}
                          </td>
                          <td>
                            {record.viajes ===
                    null
                    ? "—"
                    : record.viajes}
                          </td>
                          <td>
                            {record.kilometros ===
                    null
                    ? "—"
                    : Number(record.kilometros).toLocaleString("es-GT", {
                        maximumFractionDigits: 2,
                    })}
                          </td>
                          <td>
                            {record.horasUso ===
                    null
                    ? "—"
                    : Number(record.horasUso).toLocaleString("es-GT", {
                        maximumFractionDigits: 2,
                    })}
                          </td>
                          <td>
                            {record.observaciones ??
                    "—"}
                          </td>
                          <td>
                            {record.estado}
                          </td>
                        </tr>))}
                  </tbody>
                </table>
              </div>)}
          </section>
        </div>
      </section>
    </main>);
}

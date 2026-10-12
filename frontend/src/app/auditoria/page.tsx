"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./auditoria.module.css";

type UserProfile = { id: number; usuario: string; roles?: string[] };
type AuditEntry = {
  id: number;
  accion: string;
  modulo: string;
  registroId: number | null;
  detalle: string | null;
  fechaAccion: string;
  usuario: { id: number; usuario: string; activo: boolean };
};
type ApiError = { message?: string | string[] };
type Filters = { busqueda: string; modulo: string; accion: string; desde: string; hasta: string };
const emptyFilters: Filters = { busqueda: "", modulo: "", accion: "", desde: "", hasta: "" };

function getErrorMessage(data: ApiError, fallback: string) {
  return Array.isArray(data.message) ? data.message.join(", ") : data.message || fallback;
}
function sessionExpired() {
  localStorage.removeItem("fullterra_token");
  window.alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
  window.location.href = "/";
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-GT", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}
function localDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AuditoriaPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const pageSize = 15;

  const loadEntries = useCallback(async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/audit-log`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (response.status === 401) { sessionExpired(); return; }
      if (response.status === 403) { setError("No tienes permisos para consultar la bitácora."); return; }
      if (!response.ok) {
        const data: ApiError = await response.json().catch(() => ({}));
        setError(getErrorMessage(data, "No fue posible consultar la bitácora."));
        return;
      }
      const data: AuditEntry[] = await response.json();
      if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado");
      setEntries(data);
    } catch (requestError) {
      console.error("Error al consultar auditoría:", requestError);
      setError("No fue posible consultar la bitácora.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    async function initialize() {
      const token = localStorage.getItem("fullterra_token");
      if (!token) { window.location.href = "/"; return; }
      try {
        const response = await fetch(`${apiUrl}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        if (response.status === 401) { sessionExpired(); return; }
        if (!response.ok) { localStorage.removeItem("fullterra_token"); window.location.href = "/"; return; }
        const profile: UserProfile = await response.json();
        const allowed = profile.roles?.some((role) => role === "Administrador" || role === "Supervisor");
        if (!allowed) {
          window.alert("No tienes permisos para acceder a la bitácora.");
          if (profile.roles?.includes("Operador")) window.location.href = "/operaciones";
          else if (profile.roles?.includes("Encargado de combustible")) window.location.href = "/combustible";
          else if (profile.roles?.includes("Encargado de mantenimiento")) window.location.href = "/mantenimiento";
          else window.location.href = "/";
          return;
        }
        setUser(profile);
        await loadEntries(token);
      } catch (requestError) {
        console.error("Error al validar sesión:", requestError);
        localStorage.removeItem("fullterra_token");
        window.location.href = "/";
      } finally {
        setCheckingSession(false);
      }
    }
    void initialize();
  }, [apiUrl, loadEntries]);

  const modules = useMemo(() => [...new Set(entries.map((entry) => entry.modulo))].sort((a, b) => a.localeCompare(b, "es")), [entries]);
  const actions = useMemo(() => [...new Set(entries.map((entry) => entry.accion))].sort((a, b) => a.localeCompare(b, "es")), [entries]);
  const filtered = useMemo(() => entries.filter((entry) => {
    const search = filters.busqueda.trim().toLocaleLowerCase("es");
    if (search && ![entry.usuario?.usuario, entry.detalle, entry.modulo, entry.accion, String(entry.registroId ?? "")]
      .some((value) => (value ?? "").toLocaleLowerCase("es").includes(search))) return false;
    if (filters.modulo && entry.modulo !== filters.modulo) return false;
    if (filters.accion && entry.accion !== filters.accion) return false;
    const date = localDate(entry.fechaAccion);
    if (filters.desde && date < filters.desde) return false;
    if (filters.hasta && date > filters.hasta) return false;
    return true;
  }), [entries, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };
  const isAdmin = user?.roles?.includes("Administrador") ?? false;
  const isSupervisor = user?.roles?.includes("Supervisor") ?? false;

  if (checkingSession) return <main className={styles.loadingPage}>Cargando información...</main>;

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Image src="/images/fullterra-logo.jpeg" alt="Logo de FULLTERRA" width={48} height={48} className={styles.logo} priority />
          <span className={styles.brandName}>FULLTERRA</span>
        </div>
        <nav className={styles.navigation}>
          <Link href="/dashboard" className={styles.navItem}><span className={styles.navIcon}>▦</span>Dashboard</Link>
          {isAdmin && <Link href="/unidades" className={styles.navItem}><span className={styles.navIcon}>▣</span>Unidades</Link>}
          <Link href="/operaciones" className={styles.navItem}><span className={styles.navIcon}>◉</span>Operaciones</Link>
          <Link href="/combustible" className={styles.navItem}><span className={styles.navIcon}>◈</span>Combustible</Link>
          <Link href="/mantenimiento" className={styles.navItem}><span className={styles.navIcon}>◇</span>Mantenimiento</Link>
          <Link href="/alertas-mantenimiento" className={styles.navItem}><span className={styles.navIcon}>!</span>Alertas</Link>
          <Link href="/trazabilidad" className={styles.navItem}><span className={styles.navIcon}>≡</span>Trazabilidad</Link>
          <Link href="/indicadores" className={styles.navItem}><span className={styles.navIcon}>◫</span>Indicadores</Link>
          {(isAdmin || isSupervisor) && <Link href="/auditoria" className={`${styles.navItem} ${styles.navItemActive}`} aria-current="page"><span className={styles.navIcon}>☷</span>Auditoría</Link>}
        </nav>
        <div className={styles.sidebarFooter}>Sistema de control operacional</div>
      </aside>
      <section className={styles.content}>
        <header className={styles.topbar}>
          <div><p className={styles.sectionLabel}>CONTROL OPERACIONAL</p><h1>Bitácora / Auditoría</h1></div>
          <div className={styles.userArea}>
            <div className={styles.userAvatar}>{user?.usuario?.charAt(0).toUpperCase() ?? "U"}</div>
            <div className={styles.userInfo}><strong>{user?.usuario ?? "Usuario"}</strong><span>{user?.roles?.join(", ") ?? "Sin rol"}</span></div>
            <button type="button" className={styles.logoutButton} onClick={() => { localStorage.removeItem("fullterra_token"); window.location.href = "/"; }}>Cerrar sesión</button>
          </div>
        </header>
        <div className={styles.workspace}>
          <section className={styles.intro}>
            <div><p className={styles.panelLabel}>TRAZABILIDAD DE ACCIONES</p><h2>Historial de actividad del sistema</h2><p>Consulta las acciones registradas, sus responsables y la fecha en que se realizaron.</p></div>
            <div className={styles.summary}><div><span>Registros</span><strong>{entries.length}</strong></div><div><span>Resultados</span><strong>{filtered.length}</strong></div></div>
          </section>
          <section className={styles.filterPanel}>
            <div className={styles.panelHeader}><div><p className={styles.panelLabel}>FILTROS</p><h3>Buscar movimientos</h3></div><span className={styles.counter}>{filtered.length} resultados</span></div>
            <div className={styles.form}>
              <div className={styles.field}><label htmlFor="audit-search">Buscar usuario o detalle</label><input id="audit-search" value={filters.busqueda} onChange={(event) => updateFilter("busqueda", event.target.value)} placeholder="Usuario, registro o descripción" /></div>
              <div className={styles.field}><label htmlFor="audit-module">Módulo</label><select id="audit-module" value={filters.modulo} onChange={(event) => updateFilter("modulo", event.target.value)}><option value="">Todos</option>{modules.map((module) => <option key={module} value={module}>{module}</option>)}</select></div>
              <div className={styles.field}><label htmlFor="audit-action">Acción</label><select id="audit-action" value={filters.accion} onChange={(event) => updateFilter("accion", event.target.value)}><option value="">Todas</option>{actions.map((action) => <option key={action} value={action}>{action}</option>)}</select></div>
              <div className={styles.field}><label htmlFor="audit-from">Desde</label><input id="audit-from" type="date" max={filters.hasta || undefined} value={filters.desde} onChange={(event) => updateFilter("desde", event.target.value)} /></div>
              <div className={styles.field}><label htmlFor="audit-to">Hasta</label><input id="audit-to" type="date" min={filters.desde || undefined} value={filters.hasta} onChange={(event) => updateFilter("hasta", event.target.value)} /></div>
              <div className={styles.formActions}>
                <button type="button" className={styles.saveButton} disabled={loading} onClick={() => { const token = localStorage.getItem("fullterra_token"); if (token) void loadEntries(token); else window.location.href = "/"; }}>{loading ? "Actualizando..." : "Actualizar"}</button>
                <button type="button" className={styles.cancelButton} onClick={() => { setFilters(emptyFilters); setPage(1); }}>Restablecer</button>
              </div>
            </div>
            {error && <div className={styles.errorMessage} role="alert">{error}</div>}
          </section>
          <section className={styles.listPanel}>
            <div className={styles.panelHeader}><div><p className={styles.panelLabel}>REGISTROS DE AUDITORÍA</p><h3>Movimientos registrados</h3></div><span className={styles.counter}>Página {currentPage} de {pageCount}</span></div>
            {loading ? <div className={styles.emptyState}>Cargando registros...</div> : visible.length === 0 ? <div className={styles.emptyState}>No hay registros para los filtros seleccionados.</div> : (
              <div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>ID registro</th><th>Detalle</th></tr></thead><tbody>
                {visible.map((entry) => <tr key={entry.id}>
                  <td className={styles.nowrap}>{formatDate(entry.fechaAccion)}</td>
                  <td><strong>{entry.usuario?.usuario ?? "Usuario no disponible"}</strong><small className={styles.secondary}>{entry.usuario?.activo === false ? "Inactivo" : ""}</small></td>
                  <td>{entry.modulo}</td><td><span className={styles.actionBadge}>{entry.accion}</span></td>
                  <td>{entry.registroId ?? "—"}</td><td className={styles.detail}>{entry.detalle || "—"}</td>
                </tr>)}
              </tbody></table></div>
            )}
            {!loading && filtered.length > pageSize && <div className={styles.pagination}>
              <span>Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}</span>
              <div><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Siguiente</button></div>
            </div>}
          </section>
        </div>
      </section>
    </main>
  );
}

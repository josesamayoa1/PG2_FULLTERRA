"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./alertas-mantenimiento.module.css";

type UserProfile = {
  id: number;
  usuario: string;
  roles?: string[];
};

type AlertType = "VENCIDO" | "HOY" | "PROXIMO";

type MaintenanceAlert = {
  mantenimientoId: number;
  tipoAlerta: AlertType;
  diasRestantes: number;
  proximoServicio: string;
  tipoMantenimiento: string;
  observaciones: string | null;
  unidad: {
    id: number;
    codigo: string;
    tipo: string;
    marca: string;
    modelo: string;
  };
};

type AlertsResponse = {
  fechaReferencia: string;
  diasAnticipacion: number;
  totalAlertas: number;
  alertas: MaintenanceAlert[];
};

type ApiError = {
  message?: string | string[];
};

function obtenerFechaActual() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha: string) {
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerMensajeError(data: ApiError, fallback: string) {
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

function redirigirSesionExpirada() {
  localStorage.removeItem("fullterra_token");
  window.alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
  window.location.href = "/";
}

function etiquetaTipo(tipo: AlertType) {
  if (tipo === "VENCIDO") return "Vencido";
  if (tipo === "HOY") return "Hoy";
  return "Próximo";
}

function textoDias(alerta: MaintenanceAlert) {
  if (alerta.tipoAlerta === "HOY") return "Hoy";
  if (alerta.tipoAlerta === "VENCIDO") {
    const dias = Math.abs(alerta.diasRestantes);
    return `${dias} ${dias === 1 ? "día" : "días"} vencido`;
  }
  return `${alerta.diasRestantes} ${alerta.diasRestantes === 1 ? "día" : "días"}`;
}

export default function AlertasMantenimientoPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    diasAnticipacion: "30",
    fechaReferencia: "",
  });

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  const cargarAlertas = useCallback(
    async (
      token: string,
      diasAnticipacion: string,
      fechaReferencia: string,
    ) => {
      setLoadingAlerts(true);
      setError("");

      try {
        const params = new URLSearchParams({
          diasAnticipacion,
          fechaReferencia,
        });

        const response = await fetch(
          `${apiUrl}/maintenance-alerts?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          redirigirSesionExpirada();
          return;
        }

        if (response.status === 403) {
          setError("No tienes permisos para consultar las alertas de mantenimiento.");
          return;
        }

        if (!response.ok) {
          const data: ApiError = await response.json();
          setError(
            obtenerMensajeError(
              data,
              "No fue posible cargar las alertas de mantenimiento.",
            ),
          );
          return;
        }

        const data: AlertsResponse = await response.json();
        setAlertsData(data);
      } catch (requestError) {
        console.error("Error al cargar alertas de mantenimiento:", requestError);
        setError("No fue posible cargar las alertas de mantenimiento.");
      } finally {
        setLoadingAlerts(false);
      }
    },
    [apiUrl],
  );

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
          window.location.href = "/";
          return;
        }

        const profile: UserProfile = await response.json();
        const rolesPermitidos = [
          "Administrador",
          "Supervisor",
          "Encargado de mantenimiento",
        ];
        const tienePermiso = profile.roles?.some((role) =>
          rolesPermitidos.includes(role),
        );

        if (!tienePermiso) {
          window.alert(
            "No tienes permisos para acceder a las alertas de mantenimiento.",
          );

          if (profile.roles?.includes("Operador")) {
            window.location.href = "/operaciones";
          } else if (profile.roles?.includes("Encargado de combustible")) {
            window.location.href = "/combustible";
          } else {
            window.location.href = "/";
          }
          return;
        }

        const fechaInicial = obtenerFechaActual();
        setUser(profile);
        setFilters({ diasAnticipacion: "30", fechaReferencia: fechaInicial });
        await cargarAlertas(token, "30", fechaInicial);
      } catch (requestError) {
        console.error("Error al validar sesión:", requestError);
        localStorage.removeItem("fullterra_token");
        window.location.href = "/";
      } finally {
        setCheckingSession(false);
      }
    }

    iniciarPagina();
  }, [apiUrl, cargarAlertas]);

  function handleLogout() {
    localStorage.removeItem("fullterra_token");
    window.location.href = "/";
  }

  async function consultarAlertas(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("fullterra_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    await cargarAlertas(
      token,
      filters.diasAnticipacion,
      filters.fechaReferencia,
    );
  }

  function limpiarFiltros() {
    const nuevosFiltros = {
      diasAnticipacion: "30",
      fechaReferencia: obtenerFechaActual(),
    };
    setFilters(nuevosFiltros);

    const token = localStorage.getItem("fullterra_token");
    if (token) {
      void cargarAlertas(
        token,
        nuevosFiltros.diasAnticipacion,
        nuevosFiltros.fechaReferencia,
      );
    }
  }

  const esAdministrador =
    user?.roles?.includes("Administrador") ?? false;
  const esSupervisor =
    user?.roles?.includes("Supervisor") ?? false;
  const esEncargadoMantenimiento =
    user?.roles?.includes("Encargado de mantenimiento") ?? false;

  const puedeVerDashboard = esAdministrador || esSupervisor;
  const puedeVerOperaciones = esAdministrador || esSupervisor;
  const puedeVerCombustible = esAdministrador || esSupervisor;

  const alertas = alertsData?.alertas ?? [];
  const totalVencidas = alertas.filter(
    (alerta) => alerta.tipoAlerta === "VENCIDO",
  ).length;
  const totalHoy = alertas.filter(
    (alerta) => alerta.tipoAlerta === "HOY",
  ).length;
  const totalProximas = alertas.filter(
    (alerta) => alerta.tipoAlerta === "PROXIMO",
  ).length;

  if (checkingSession) {
    return (
      <main className={styles.loadingPage}>
        Cargando información...
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Image
            src="/images/fullterra-logo.jpeg"
            alt="Logo de FULLTERRA"
            width={48}
            height={48}
            className={styles.logo}
            priority
          />
          <span className={styles.brandName}>FULLTERRA</span>
        </div>

        <nav className={styles.navigation}>
          {puedeVerDashboard && (
            <Link href="/dashboard" className={styles.navItem}>
              <span className={styles.navIcon}>▦</span>
              Dashboard
            </Link>
          )}

          {esAdministrador && (
            <Link href="/unidades" className={styles.navItem}>
              <span className={styles.navIcon}>▣</span>
              Unidades
            </Link>
          )}

          {puedeVerOperaciones && (
            <Link href="/operaciones" className={styles.navItem}>
              <span className={styles.navIcon}>◉</span>
              Operaciones
            </Link>
          )}

          {puedeVerCombustible && (
            <Link href="/combustible" className={styles.navItem}>
              <span className={styles.navIcon}>◈</span>
              Combustible
            </Link>
          )}

          <Link href="/mantenimiento" className={styles.navItem}>
            <span className={styles.navIcon}>◇</span>
            Mantenimiento
          </Link>

          <Link
            href="/alertas-mantenimiento"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span className={styles.navIcon}>!</span>
            Alertas
          </Link>

          {!esEncargadoMantenimiento && (
            <>
              <Link href="/trazabilidad" className={styles.navItem}>
                <span className={styles.navIcon}>≡</span>
                Trazabilidad
              </Link>

              <Link href="/indicadores" className={styles.navItem}>
                <span className={styles.navIcon}>◫</span>
                Indicadores
              </Link>
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          Sistema de control operacional
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.sectionLabel}>CONTROL OPERACIONAL</p>
            <h1>Alertas de mantenimiento</h1>
          </div>

          <div className={styles.userArea}>
            <div className={styles.userAvatar}>
              {user?.usuario?.charAt(0).toUpperCase() ?? "U"}
            </div>

            <div className={styles.userInfo}>
              <strong>{user?.usuario ?? "Usuario"}</strong>
              <span>{user?.roles?.join(", ") ?? "Sin rol"}</span>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className={styles.workspace}>
          <section className={styles.filterPanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>FILTROS</p>
                <h3>Consultar alertas</h3>
              </div>
              <span className={styles.counter}>
                {alertsData?.totalAlertas ?? 0} alertas
              </span>
            </div>

            <form className={styles.form} onSubmit={consultarAlertas}>
              <div className={styles.field}>
                <label htmlFor="reference-date">Fecha de referencia</label>
                <input
                  id="reference-date"
                  type="date"
                  required
                  value={filters.fechaReferencia}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      fechaReferencia: event.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="anticipation-days">Días de anticipación</label>
                <input
                  id="anticipation-days"
                  type="number"
                  min="0"
                  max="365"
                  step="1"
                  required
                  value={filters.diasAnticipacion}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      diasAnticipacion: event.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loadingAlerts}
                >
                  {loadingAlerts ? "Consultando..." : "Consultar"}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={limpiarFiltros}
                  disabled={loadingAlerts}
                >
                  Restablecer
                </button>
              </div>
            </form>

            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}
          </section>

          <section className={styles.intro}>
            <div className={styles.introText}>
              <p className={styles.introLabel}>MANTENIMIENTO PREVENTIVO</p>
              <h2>Seguimiento de próximos servicios</h2>
              <p>
                Consulta mantenimientos vencidos, programados para hoy o próximos
                a realizarse según el período de anticipación seleccionado.
              </p>
            </div>

            <div className={styles.summary}>
              <div>
                <span>Total</span>
                <strong>{alertsData?.totalAlertas ?? 0}</strong>
              </div>
              <div className={styles.summaryVencidas}>
                <span>Vencidas</span>
                <strong>{totalVencidas}</strong>
              </div>
              <div className={styles.summaryHoy}>
                <span>Hoy</span>
                <strong>{totalHoy}</strong>
              </div>
              <div className={styles.summaryProximas}>
                <span>Próximas</span>
                <strong>{totalProximas}</strong>
              </div>
            </div>
          </section>

          <section className={styles.listPanel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>ALERTAS ACTIVAS</p>
                <h3>Servicios por atender</h3>
              </div>
              <span className={styles.periodBadge}>
                Referencia:{" "}
                {alertsData
                  ? formatearFecha(alertsData.fechaReferencia)
                  : "—"}
              </span>
            </div>

            {loadingAlerts ? (
              <div className={styles.emptyState}>
                Cargando alertas de mantenimiento...
              </div>
            ) : alertas.length === 0 ? (
              <div className={styles.emptyState}>
                No existen alertas dentro del período seleccionado.
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Unidad</th>
                      <th>Tipo unidad</th>
                      <th>Mantenimiento</th>
                      <th>Próximo servicio</th>
                      <th>Días</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.map((alerta) => (
                      <tr key={alerta.mantenimientoId}>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              alerta.tipoAlerta === "VENCIDO"
                                ? styles.statusVencido
                                : alerta.tipoAlerta === "HOY"
                                  ? styles.statusHoy
                                  : styles.statusProximo
                            }`}
                          >
                            {etiquetaTipo(alerta.tipoAlerta)}
                          </span>
                        </td>
                        <td>
                          <strong>{alerta.unidad.codigo}</strong>
                          <small className={styles.unitDetail}>
                            {alerta.unidad.marca} {alerta.unidad.modelo}
                          </small>
                        </td>
                        <td>{alerta.unidad.tipo}</td>
                        <td>{alerta.tipoMantenimiento}</td>
                        <td>{formatearFecha(alerta.proximoServicio)}</td>
                        <td>
                          <strong>{textoDias(alerta)}</strong>
                        </td>
                        <td>{alerta.observaciones ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

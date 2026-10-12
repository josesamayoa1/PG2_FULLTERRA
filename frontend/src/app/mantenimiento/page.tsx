"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./mantenimiento.module.css";

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

type MaintenanceRecord = {
  id: number;
  tipoMantenimiento: string;
  observaciones: string | null;
  fechaMantenimiento: string;
  proximoServicio: string | null;
  kilometrajeHoras: number | null;
  costo: number | null;
  taller: string | null;
  estado: string;

  unidad: {
    id: number;
    codigo: string;
    tipo: string;
  };
};

type ApiError = {
  message?: string | string[];
};

function obtenerFechaActual() {
  const fecha = new Date();

  const anio =
    fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(
  fecha: string | null,
) {
  if (!fecha) {
    return "—";
  }

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerMensajeError(
  data: ApiError,
  fallback: string,
) {
  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (
    typeof data.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  return fallback;
}

function redirigirSesionExpirada() {
  localStorage.removeItem(
    "fullterra_token",
  );

  window.alert(
    "Tu sesión ha expirado. Inicia sesión nuevamente.",
  );

  window.location.href = "/";
}

export default function MantenimientoPage() {
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [user, setUser] =
    useState<UserProfile | null>(
      null,
    );

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [
    maintenanceRecords,
    setMaintenanceRecords,
  ] =
    useState<MaintenanceRecord[]>(
      [],
    );

  const [
    loadingData,
    setLoadingData,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      unidadId: "",
      tipoMantenimiento: "",
      fechaMantenimiento: "",
      proximoServicio: "",
      kilometrajeHoras: "",
      costo: "",
      taller: "",
      observaciones: "",
    });

  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";

  const cargarDatos =
    useCallback(
      async (token: string) => {
        setLoadingData(true);
        setError("");

        try {
          const respuestas =
            await Promise.all([
              fetch(
                `${apiUrl}/units`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),

              fetch(
                `${apiUrl}/maintenance`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),
            ]);

          if (
            respuestas.some(
              (response) =>
                response.status ===
                401,
            )
          ) {
            redirigirSesionExpirada();
            return;
          }

          if (
            respuestas.some(
              (response) =>
                response.status ===
                403,
            )
          ) {
            setError(
              "No tienes permisos para acceder al módulo de mantenimiento.",
            );

            return;
          }

          if (
            respuestas.some(
              (response) =>
                !response.ok,
            )
          ) {
            throw new Error(
              "No fue posible cargar la información de mantenimiento.",
            );
          }

          const [
            unitsData,
            maintenanceData,
          ] = await Promise.all([
            respuestas[0].json(),
            respuestas[1].json(),
          ]);

          setUnits(
            unitsData as Unit[],
          );

          setMaintenanceRecords(
            maintenanceData as MaintenanceRecord[],
          );
        } catch (requestError) {
          console.error(
            "Error al cargar mantenimiento:",
            requestError,
          );

          setError(
            "No fue posible cargar la información de mantenimiento.",
          );
        } finally {
          setLoadingData(false);
        }
      },
      [apiUrl],
    );

  useEffect(() => {
    const fechaActual =
      obtenerFechaActual();

    setForm(
      (currentForm) => ({
        ...currentForm,
        fechaMantenimiento:
          fechaActual,
      }),
    );
  }, []);

  useEffect(() => {
    async function iniciarPagina() {
      const token =
        localStorage.getItem(
          "fullterra_token",
        );

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const response =
          await fetch(
            `${apiUrl}/auth/profile`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (
          response.status === 401
        ) {
          redirigirSesionExpirada();
          return;
        }

        if (!response.ok) {
          localStorage.removeItem(
            "fullterra_token",
          );

          window.location.href =
            "/";

          return;
        }

        const profile:
          UserProfile =
          await response.json();

        const rolesPermitidos = [
          "Administrador",
          "Supervisor",
          "Encargado de mantenimiento",
        ];

        const tienePermiso =
          profile.roles?.some(
            (role) =>
              rolesPermitidos.includes(
                role,
              ),
          );

        if (!tienePermiso) {
          window.alert(
            "No tienes permisos para acceder al módulo de mantenimiento.",
          );

          if (
            profile.roles?.includes(
              "Operador",
            )
          ) {
            window.location.href =
              "/operaciones";
          } else if (
            profile.roles?.includes(
              "Encargado de combustible",
            )
          ) {
            window.location.href =
              "/combustible";
          } else {
            window.location.href =
              "/";
          }

          return;
        }

        setUser(profile);

        await cargarDatos(token);
      } catch (requestError) {
        console.error(
          "Error al validar sesión:",
          requestError,
        );

        localStorage.removeItem(
          "fullterra_token",
        );

        window.location.href = "/";
      } finally {
        setCheckingSession(false);
      }
    }

    iniciarPagina();
  }, [
    apiUrl,
    cargarDatos,
  ]);

  function handleLogout() {
    localStorage.removeItem(
      "fullterra_token",
    );

    window.location.href = "/";
  }

  function limpiarFormulario() {
    setForm({
      unidadId: "",
      tipoMantenimiento: "",
      fechaMantenimiento:
        obtenerFechaActual(),
      proximoServicio: "",
      kilometrajeHoras: "",
      costo: "",
      taller: "",
      observaciones: "",
    });
  }

  async function registrarMantenimiento(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token =
      localStorage.getItem(
        "fullterra_token",
      );

    if (!token) {
      window.location.href = "/";
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const body = {
        unidadId: Number(
          form.unidadId,
        ),

        tipoMantenimiento:
          form.tipoMantenimiento.trim(),

        fechaMantenimiento:
          form.fechaMantenimiento,

        proximoServicio:
          form.proximoServicio ||
          undefined,

        kilometrajeHoras:
          form.kilometrajeHoras ===
          ""
            ? undefined
            : Number(
                form.kilometrajeHoras,
              ),

        costo:
          form.costo === ""
            ? undefined
            : Number(form.costo),

        taller:
          form.taller.trim() ||
          undefined,

        observaciones:
          form.observaciones
            .trim() ||
          undefined,
      };

      const response =
        await fetch(
          `${apiUrl}/maintenance`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              body,
            ),
          },
        );

      if (
        response.status === 401
      ) {
        redirigirSesionExpirada();
        return;
      }

      if (
        response.status === 403
      ) {
        setError(
          "No tienes permisos para registrar mantenimientos.",
        );

        return;
      }

      if (!response.ok) {
        const data: ApiError =
          await response.json();

        setError(
          obtenerMensajeError(
            data,
            "No fue posible registrar el mantenimiento.",
          ),
        );

        return;
      }

      limpiarFormulario();

      setMessage(
        "Mantenimiento registrado correctamente.",
      );

      await cargarDatos(token);
    } catch (requestError) {
      console.error(
        "Error al registrar mantenimiento:",
        requestError,
      );

      setError(
        "No fue posible registrar el mantenimiento.",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalMantenimientos =
    maintenanceRecords.length;

  const mantenimientosCamiones =
    maintenanceRecords.filter(
      (record) =>
        record.unidad.tipo ===
        "CAMION",
    ).length;

  const mantenimientosMaquinaria =
    maintenanceRecords.filter(
      (record) =>
        record.unidad.tipo ===
        "MAQUINARIA",
    ).length;

  const costoTotal =
    maintenanceRecords.reduce(
      (total, record) =>
        total +
        Number(
          record.costo ?? 0,
        ),
      0,
    );

  const esAdministrador =
    user?.roles?.includes(
      "Administrador",
    ) ?? false;

  const esSupervisor =
    user?.roles?.includes(
      "Supervisor",
    ) ?? false;

  const esEncargadoMantenimiento =
    user?.roles?.includes(
      "Encargado de mantenimiento",
    ) ?? false;

  const puedeVerDashboard =
    esAdministrador ||
    esSupervisor;

  const puedeVerOperaciones =
    esAdministrador ||
    esSupervisor;

  const puedeVerCombustible =
    esAdministrador ||
    esSupervisor;

  if (checkingSession) {
    return (
      <main
        className={
          styles.loadingPage
        }
      >
        Cargando información...
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <aside
        className={styles.sidebar}
      >
        <div
          className={styles.brand}
        >
          <Image
            src="/images/fullterra-logo.jpeg"
            alt="Logo de FULLTERRA"
            width={48}
            height={48}
            className={
              styles.logo
            }
            priority
          />

          <span
            className={
              styles.brandName
            }
          >
            FULLTERRA
          </span>
        </div>

        <nav
          className={
            styles.navigation
          }
        >
          {puedeVerDashboard && (
            <Link
              href="/dashboard"
              className={
                styles.navItem
              }
            >
              <span
                className={
                  styles.navIcon
                }
              >
                ▦
              </span>

              Dashboard
            </Link>
          )}

          {esAdministrador && (
            <Link
              href="/unidades"
              className={
                styles.navItem
              }
            >
              <span
                className={
                  styles.navIcon
                }
              >
                ▣
              </span>

              Unidades
            </Link>
          )}

          {puedeVerOperaciones && (
            <Link
              href="/operaciones"
              className={
                styles.navItem
              }
            >
              <span
                className={
                  styles.navIcon
                }
              >
                ◉
              </span>

              Operaciones
            </Link>
          )}

          {puedeVerCombustible && (
            <Link
              href="/combustible"
              className={
                styles.navItem
              }
            >
              <span
                className={
                  styles.navIcon
                }
              >
                ◈
              </span>

              Combustible
            </Link>
          )}

          <Link
            href="/mantenimiento"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span
              className={
                styles.navIcon
              }
            >
              ◇
            </span>

            Mantenimiento
          </Link>

          {!esEncargadoMantenimiento && (
            <>
              <Link
                href="/trazabilidad"
                className={
                    styles.navItem
                }
                >
                <span
                    className={
                    styles.navIcon
                    }
                >
                    ≡
                </span>

                Trazabilidad
                </Link>

              <Link
                href="/indicadores"
                className={
                    styles.navItem
                }
                >
                <span
                    className={
                    styles.navIcon
                    }
                >
                    ◫
                </span>

                Indicadores
                </Link>

            </>
          )}
        </nav>

        <div
          className={
            styles.sidebarFooter
          }
        >
          Sistema de control
          operacional
        </div>
      </aside>

      <section
        className={styles.content}
      >
        <header
          className={styles.topbar}
        >
          <div>
            <p
              className={
                styles.sectionLabel
              }
            >
              CONTROL OPERACIONAL
            </p>

            <h1>
              Mantenimiento
            </h1>
          </div>

          <div
            className={
              styles.userArea
            }
          >
            <div
              className={
                styles.userAvatar
              }
            >
              {user?.usuario
                ?.charAt(0)
                .toUpperCase() ??
                "U"}
            </div>

            <div
              className={
                styles.userInfo
              }
            >
              <strong>
                {user?.usuario ??
                  "Usuario"}
              </strong>

              <span>
                {user?.roles?.join(
                  ", ",
                ) ??
                  "Sin rol"}
              </span>
            </div>

            <button
              type="button"
              className={
                styles.logoutButton
              }
              onClick={
                handleLogout
              }
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div
          className={
            styles.workspace
          }
        >
          <section
            className={
              styles.intro
            }
          >
            <div>
              <p
                className={
                  styles.introLabel
                }
              >
                CONTROL DE MANTENIMIENTO
              </p>

              <h2>
                Registro de servicios
              </h2>

              <p>
                Registra los
                mantenimientos realizados
                a camiones y maquinaria,
                conserva el historial de
                servicios y controla las
                fechas del próximo
                mantenimiento.
              </p>
            </div>

            <div
              className={
                styles.summary
              }
            >
              <div>
                <span>
                  Registros
                </span>

                <strong>
                  {
                    totalMantenimientos
                  }
                </strong>
              </div>

              <div>
                <span>
                  Camiones
                </span>

                <strong>
                  {
                    mantenimientosCamiones
                  }
                </strong>
              </div>

              <div>
                <span>
                  Maquinaria
                </span>

                <strong>
                  {
                    mantenimientosMaquinaria
                  }
                </strong>
              </div>

              <div>
                <span>
                  Costo total
                </span>

                <strong>
                  Q
                  {costoTotal.toLocaleString(
                    "es-GT",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    },
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section
            className={
              styles.formPanel
            }
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <div>
                <p
                  className={
                    styles.panelLabel
                  }
                >
                  NUEVO REGISTRO
                </p>

                <h3>
                  Registrar mantenimiento
                </h3>
              </div>
            </div>

            <form
              className={
                styles.form
              }
              onSubmit={
                registrarMantenimiento
              }
            >
              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-unit"
                >
                  Unidad
                </label>

                <select
                  id="maintenance-unit"
                  required
                  value={
                    form.unidadId
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      unidadId:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="">
                    Selecciona una
                    unidad
                  </option>

                  {units.map(
                    (unit) => (
                      <option
                        key={
                          unit.id
                        }
                        value={
                          unit.id
                        }
                      >
                        {
                          unit.codigo
                        }{" "}
                        -{" "}
                        {
                          unit.tipo
                        }{" "}
                        -{" "}
                        {
                          unit.marca
                        }{" "}
                        {
                          unit.modelo
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-type"
                >
                  Tipo de mantenimiento
                </label>

                <input
                  id="maintenance-type"
                  type="text"
                  required
                  value={
                    form.tipoMantenimiento
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      tipoMantenimiento:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Ej. Preventivo"
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-date"
                >
                  Fecha de mantenimiento
                </label>

                <input
                  id="maintenance-date"
                  type="date"
                  required
                  value={
                    form.fechaMantenimiento
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      fechaMantenimiento:
                        event.target
                          .value,
                    })
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-next-date"
                >
                  Próximo servicio
                </label>

                <input
                  id="maintenance-next-date"
                  type="date"
                  value={
                    form.proximoServicio
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      proximoServicio:
                        event.target
                          .value,
                    })
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-meter"
                >
                  Kilometraje / Horas
                </label>

                <input
                  id="maintenance-meter"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.kilometrajeHoras
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      kilometrajeHoras:
                        event.target
                          .value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-cost"
                >
                  Costo
                </label>

                <input
                  id="maintenance-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.costo
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      costo:
                        event.target
                          .value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="maintenance-workshop"
                >
                  Taller
                </label>

                <input
                  id="maintenance-workshop"
                  type="text"
                  value={
                    form.taller
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      taller:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Taller o proveedor"
                />
              </div>

              <div
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <label
                  htmlFor="maintenance-observations"
                >
                  Observaciones
                </label>

                <textarea
                  id="maintenance-observations"
                  rows={3}
                  value={
                    form.observaciones
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      observaciones:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Observaciones opcionales"
                />
              </div>

              <div
                className={`${styles.formActions} ${styles.fieldFull}`}
              >
                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : "Registrar mantenimiento"}
                </button>
              </div>
            </form>

            {message && (
              <div
                className={
                  styles.successMessage
                }
              >
                {message}
              </div>
            )}

            {error && (
              <div
                className={
                  styles.errorMessage
                }
              >
                {error}
              </div>
            )}
          </section>

          <section
            className={
              styles.listPanel
            }
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <div>
                <p
                  className={
                    styles.panelLabel
                  }
                >
                  HISTORIAL
                </p>

                <h3>
                  Mantenimientos
                  registrados
                </h3>
              </div>

              <span
                className={
                  styles.counter
                }
              >
                {
                  maintenanceRecords.length
                }{" "}
                registros
              </span>
            </div>

            {loadingData ? (
              <div
                className={
                  styles.emptyState
                }
              >
                Cargando registros de
                mantenimiento...
              </div>
            ) : maintenanceRecords.length ===
              0 ? (
              <div
                className={
                  styles.emptyState
                }
              >
                No existen mantenimientos
                registrados.
              </div>
            ) : (
              <div
                className={
                  styles.tableWrapper
                }
              >
                <table
                  className={
                    styles.table
                  }
                >
                  <thead>
                    <tr>
                      <th>
                        Fecha
                      </th>

                      <th>
                        Unidad
                      </th>

                      <th>
                        Tipo unidad
                      </th>

                      <th>
                        Mantenimiento
                      </th>

                      <th>
                        Próximo servicio
                      </th>

                      <th>
                        Km / Horas
                      </th>

                      <th>
                        Costo
                      </th>

                      <th>
                        Taller
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
                    {[
                      ...maintenanceRecords,
                    ]
                      .reverse()
                      .map(
                        (
                          record,
                        ) => (
                          <tr
                            key={
                              record.id
                            }
                          >
                            <td>
                              {formatearFecha(
                                record.fechaMantenimiento,
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  record
                                    .unidad
                                    .codigo
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                record
                                  .unidad
                                  .tipo
                              }
                            </td>

                            <td>
                              {
                                record.tipoMantenimiento
                              }
                            </td>

                            <td>
                              {formatearFecha(
                                record.proximoServicio,
                              )}
                            </td>

                            <td>
                              {record.kilometrajeHoras ===
                              null
                                ? "—"
                                : Number(
                                    record.kilometrajeHoras,
                                  ).toLocaleString(
                                    "es-GT",
                                    {
                                      maximumFractionDigits:
                                        2,
                                    },
                                  )}
                            </td>

                            <td>
                              {record.costo ===
                              null
                                ? "—"
                                : `Q${Number(
                                    record.costo,
                                  ).toLocaleString(
                                    "es-GT",
                                    {
                                      minimumFractionDigits:
                                        2,
                                      maximumFractionDigits:
                                        2,
                                    },
                                  )}`}
                            </td>

                            <td>
                              {
                                record.taller ??
                                "—"
                              }
                            </td>

                            <td>
                              {
                                record.observaciones ??
                                "—"
                              }
                            </td>

                            <td>
                              {
                                record.estado
                              }
                            </td>
                          </tr>
                        ),
                      )}
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
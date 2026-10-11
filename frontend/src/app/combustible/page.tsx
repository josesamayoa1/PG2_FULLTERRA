"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./combustible.module.css";

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

type FuelLoad = {
  id: number;
  fechaCarga: string;
  galones: number;
  observaciones: string | null;
  estado: string;

  unidad: {
    id: number;
    codigo: string;
    tipo: string;
  };

  usuario: {
    id: number;
    usuario: string;
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
  fecha: string,
) {
  if (!fecha) {
    return "—";
  }

  const partes =
    fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerMensajeError(
  data: ApiError,
  fallback: string,
) {
  if (
    Array.isArray(data.message)
  ) {
    return data.message.join(
      ", ",
    );
  }

  if (
    typeof data.message ===
      "string" &&
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

export default function CombustiblePage() {
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
    fuelLoads,
    setFuelLoads,
  ] =
    useState<FuelLoad[]>([]);

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
      fechaCarga: "",
      galones: "",
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
                `${apiUrl}/fuel`,
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
              "No tienes permisos para acceder al módulo de combustible.",
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
              "No fue posible cargar la información de combustible.",
            );
          }

          const [
            unitsData,
            fuelData,
          ] = await Promise.all([
            respuestas[0].json(),
            respuestas[1].json(),
          ]);

          setUnits(
            unitsData as Unit[],
          );

          setFuelLoads(
            fuelData as FuelLoad[],
          );
        } catch (requestError) {
          console.error(
            "Error al cargar combustible:",
            requestError,
          );

          setError(
            "No fue posible cargar la información de combustible.",
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
        fechaCarga: fechaActual,
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
          "Encargado de combustible",
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
            "No tienes permisos para acceder al módulo de combustible.",
          );

          if (
            profile.roles?.includes(
              "Operador",
            )
          ) {
            window.location.href =
              "/operaciones";
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
      fechaCarga:
        obtenerFechaActual(),
      galones: "",
      observaciones: "",
    });
  }

  async function registrarCarga(
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
      const response =
        await fetch(
          `${apiUrl}/fuel`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              unidadId: Number(
                form.unidadId,
              ),

              fechaCarga:
                form.fechaCarga,

              galones: Number(
                form.galones,
              ),

              observaciones:
                form.observaciones
                  .trim() ||
                undefined,
            }),
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
          "No tienes permisos para registrar cargas de combustible.",
        );

        return;
      }

      if (!response.ok) {
        const data: ApiError =
          await response.json();

        setError(
          obtenerMensajeError(
            data,
            "No fue posible registrar la carga de combustible.",
          ),
        );

        return;
      }

      limpiarFormulario();

      setMessage(
        "Carga de combustible registrada correctamente.",
      );

      await cargarDatos(token);
    } catch (requestError) {
      console.error(
        "Error al registrar combustible:",
        requestError,
      );

      setError(
        "No fue posible registrar la carga de combustible.",
      );
    } finally {
      setSaving(false);
    }
  }

  const unidadesDisponibles =
    units.filter(
      (unit) =>
        unit.activo &&
        unit.estado ===
          "DISPONIBLE",
    );

  const totalCargas =
    fuelLoads.length;

  const totalGalones =
    fuelLoads.reduce(
      (total, load) =>
        total +
        Number(load.galones),
      0,
    );

  const galonesCamiones =
    fuelLoads.reduce(
      (total, load) =>
        load.unidad.tipo ===
        "CAMION"
          ? total +
            Number(load.galones)
          : total,
      0,
    );

  const galonesMaquinaria =
    fuelLoads.reduce(
      (total, load) =>
        load.unidad.tipo ===
        "MAQUINARIA"
          ? total +
            Number(load.galones)
          : total,
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

  const esEncargadoCombustible =
    user?.roles?.includes(
      "Encargado de combustible",
    ) ?? false;

  const puedeVerDashboard =
    esAdministrador ||
    esSupervisor;

  const puedeVerOperaciones =
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

          <Link
            href="/combustible"
            className={`${styles.navItem} ${styles.navItemActive}`}
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

          {!esEncargadoCombustible && (
            <>
              <button
                type="button"
                className={
                  styles.navItem
                }
              >
                <span
                  className={
                    styles.navIcon
                  }
                >
                  ◇
                </span>

                Mantenimiento
              </button>

              <button
                type="button"
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
              </button>

              <button
                type="button"
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
              </button>
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
              Combustible
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
                CONTROL DE COMBUSTIBLE
              </p>

              <h2>
                Registro de cargas
              </h2>

              <p>
                Registra el combustible
                suministrado a camiones
                y maquinaria disponible,
                manteniendo el historial
                y el responsable de cada
                carga.
              </p>
            </div>

            <div
              className={
                styles.summary
              }
            >
              <div>
                <span>
                  Cargas
                </span>

                <strong>
                  {totalCargas}
                </strong>
              </div>

              <div>
                <span>
                  Galones
                </span>

                <strong>
                  {totalGalones.toLocaleString(
                    "es-GT",
                    {
                      maximumFractionDigits:
                        2,
                    },
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Camiones
                </span>

                <strong>
                  {galonesCamiones.toLocaleString(
                    "es-GT",
                    {
                      maximumFractionDigits:
                        2,
                    },
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Maquinaria
                </span>

                <strong>
                  {galonesMaquinaria.toLocaleString(
                    "es-GT",
                    {
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
                  NUEVA CARGA
                </p>

                <h3>
                  Registrar combustible
                </h3>
              </div>
            </div>

            <form
              className={
                styles.form
              }
              onSubmit={
                registrarCarga
              }
            >
              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="fuel-unit"
                >
                  Unidad
                </label>

                <select
                  id="fuel-unit"
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

                  {unidadesDisponibles.map(
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
                  htmlFor="fuel-date"
                >
                  Fecha de carga
                </label>

                <input
                  id="fuel-date"
                  type="date"
                  required
                  value={
                    form.fechaCarga
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      fechaCarga:
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
                  htmlFor="fuel-gallons"
                >
                  Galones
                </label>

                <input
                  id="fuel-gallons"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={
                    form.galones
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      galones:
                        event.target
                          .value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <label
                  htmlFor="fuel-observations"
                >
                  Observaciones
                </label>

                <textarea
                  id="fuel-observations"
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
                    : "Registrar carga"}
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
                  Cargas registradas
                </h3>
              </div>

              <span
                className={
                  styles.counter
                }
              >
                {fuelLoads.length}{" "}
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
                combustible...
              </div>
            ) : fuelLoads.length ===
              0 ? (
              <div
                className={
                  styles.emptyState
                }
              >
                No existen cargas de
                combustible registradas.
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
                        Tipo
                      </th>

                      <th>
                        Galones
                      </th>

                      <th>
                        Responsable
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
                      ...fuelLoads,
                    ]
                      .reverse()
                      .map(
                        (load) => (
                          <tr
                            key={
                              load.id
                            }
                          >
                            <td>
                              {formatearFecha(
                                load.fechaCarga,
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  load
                                    .unidad
                                    .codigo
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                load
                                  .unidad
                                  .tipo
                              }
                            </td>

                            <td>
                              {Number(
                                load.galones,
                              ).toLocaleString(
                                "es-GT",
                                {
                                  maximumFractionDigits:
                                    2,
                                },
                              )}
                            </td>

                            <td>
                              {
                                load
                                  .usuario
                                  .usuario
                              }
                            </td>

                            <td>
                              {
                                load.observaciones ??
                                "—"
                              }
                            </td>

                            <td>
                              {
                                load.estado
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
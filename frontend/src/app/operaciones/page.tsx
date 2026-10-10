"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./operaciones.module.css";

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

type ActivityType = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria: string;
  activo: boolean;
};

type Trip = {
  id: number;
  fechaOperacion: string;
  viajes: number;
  kilometros: number | null;
  observaciones: string | null;
  estado: string;

  unidad: {
    id: number;
    codigo: string;
    tipo: string;
  };

  empleado: {
    id: number;
    nombres: string;
  };

  actividad: {
    id: number;
    nombre: string;
  };
};

type MachineryHours = {
  id: number;
  fechaOperacion: string;
  horasUso: number | null;
  observaciones: string | null;
  estado: string;

  unidad: {
    id: number;
    codigo: string;
    tipo: string;
  };

  empleado: {
    id: number;
    nombres: string;
  };

  actividad: {
    id: number;
    nombre: string;
  };
};

type OperationMode =
  | "VIAJE"
  | "MAQUINARIA";

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

export default function OperacionesPage() {
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [user, setUser] =
    useState<UserProfile | null>(
      null,
    );

  const [
    operationMode,
    setOperationMode,
  ] =
    useState<OperationMode>(
      "VIAJE",
    );

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

  const [
    activities,
    setActivities,
  ] =
    useState<ActivityType[]>([]);

  const [trips, setTrips] =
    useState<Trip[]>([]);

  const [
    machineryHours,
    setMachineryHours,
  ] =
    useState<
      MachineryHours[]
    >([]);

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

  const [tripForm, setTripForm] =
    useState({
      unidadId: "",
      empleadoId: "",
      tipoActividadId: "",
      fechaOperacion: "",
      viajes: "",
      kilometros: "",
      observaciones: "",
    });

  const [
    machineryForm,
    setMachineryForm,
  ] = useState({
    unidadId: "",
    empleadoId: "",
    tipoActividadId: "",
    fechaOperacion: "",
    horasUso: "",
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
                `${apiUrl}/employees`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),

              fetch(
                `${apiUrl}/activity-types`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),

              fetch(
                `${apiUrl}/asset-operations/trips`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),

              fetch(
                `${apiUrl}/asset-operations/machinery-hours`,
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
              "No tienes permisos para acceder al módulo de operaciones.",
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
              "No fue posible cargar la información de operaciones.",
            );
          }

          const [
            unitsData,
            employeesData,
            activitiesData,
            tripsData,
            machineryHoursData,
          ] = await Promise.all([
            respuestas[0].json(),
            respuestas[1].json(),
            respuestas[2].json(),
            respuestas[3].json(),
            respuestas[4].json(),
          ]);

          setUnits(
            unitsData as Unit[],
          );

          setEmployees(
            employeesData as Employee[],
          );

          setActivities(
            activitiesData as ActivityType[],
          );

          setTrips(
            tripsData as Trip[],
          );

          setMachineryHours(
            machineryHoursData as
              MachineryHours[],
          );
        } catch (requestError) {
          console.error(
            "Error al cargar operaciones:",
            requestError,
          );

          setError(
            "No fue posible cargar la información de operaciones.",
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

    setTripForm(
      (currentForm) => ({
        ...currentForm,
        fechaOperacion:
          fechaActual,
      }),
    );

    setMachineryForm(
      (currentForm) => ({
        ...currentForm,
        fechaOperacion:
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
          "Operador",
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
            "No tienes permisos para acceder al módulo de operaciones.",
          );

          window.location.href =
            "/dashboard";

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

  function cambiarModo(
    mode: OperationMode,
  ) {
    setOperationMode(mode);

    setMessage("");
    setError("");
  }

  function limpiarFormularioViaje() {
    setTripForm({
      unidadId: "",
      empleadoId: "",
      tipoActividadId: "",
      fechaOperacion:
        obtenerFechaActual(),
      viajes: "",
      kilometros: "",
      observaciones: "",
    });
  }

  function limpiarFormularioMaquinaria() {
    setMachineryForm({
      unidadId: "",
      empleadoId: "",
      tipoActividadId: "",
      fechaOperacion:
        obtenerFechaActual(),
      horasUso: "",
      observaciones: "",
    });
  }

  async function registrarViaje(
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
          `${apiUrl}/asset-operations/trips`,
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
                tripForm.unidadId,
              ),

              empleadoId: Number(
                tripForm.empleadoId,
              ),

              tipoActividadId:
                Number(
                  tripForm.tipoActividadId,
                ),

              fechaOperacion:
                tripForm.fechaOperacion,

              viajes: Number(
                tripForm.viajes,
              ),

              kilometros: Number(
                tripForm.kilometros,
              ),

              observaciones:
                tripForm.observaciones
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
          "No tienes permisos para registrar operaciones.",
        );

        return;
      }

      if (!response.ok) {
        const data: ApiError =
          await response.json();

        setError(
          obtenerMensajeError(
            data,
            "No fue posible registrar el viaje.",
          ),
        );

        return;
      }

      limpiarFormularioViaje();

      setMessage(
        "Viaje registrado correctamente.",
      );

      await cargarDatos(token);
    } catch (requestError) {
      console.error(
        "Error al registrar viaje:",
        requestError,
      );

      setError(
        "No fue posible registrar el viaje.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function registrarHorasMaquinaria(
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
          `${apiUrl}/asset-operations/machinery-hours`,
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
                machineryForm.unidadId,
              ),

              empleadoId: Number(
                machineryForm.empleadoId,
              ),

              tipoActividadId:
                Number(
                  machineryForm.tipoActividadId,
                ),

              fechaOperacion:
                machineryForm.fechaOperacion,

              horasUso: Number(
                machineryForm.horasUso,
              ),

              observaciones:
                machineryForm.observaciones
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
          "No tienes permisos para registrar operaciones.",
        );

        return;
      }

      if (!response.ok) {
        const data: ApiError =
          await response.json();

        setError(
          obtenerMensajeError(
            data,
            "No fue posible registrar las horas de maquinaria.",
          ),
        );

        return;
      }

      limpiarFormularioMaquinaria();

      setMessage(
        "Horas de maquinaria registradas correctamente.",
      );

      await cargarDatos(token);
    } catch (requestError) {
      console.error(
        "Error al registrar horas de maquinaria:",
        requestError,
      );

      setError(
        "No fue posible registrar las horas de maquinaria.",
      );
    } finally {
      setSaving(false);
    }
  }

  const camionesDisponibles =
    units.filter(
      (unit) =>
        unit.tipo === "CAMION" &&
        unit.activo &&
        unit.estado ===
          "DISPONIBLE",
    );

  const maquinariaDisponible =
    units.filter(
      (unit) =>
        unit.tipo ===
          "MAQUINARIA" &&
        unit.activo &&
        unit.estado ===
          "DISPONIBLE",
    );

  const empleadosActivos =
    employees.filter(
      (employee) =>
        employee.activo,
    );

  const actividadesCamion =
    activities.filter(
      (activity) =>
        activity.categoria ===
          "CAMION" &&
        activity.activo,
    );

  const actividadesMaquinaria =
    activities.filter(
      (activity) =>
        activity.categoria ===
          "MAQUINARIA" &&
        activity.activo,
    );

  const totalViajes =
    trips.reduce(
      (total, trip) =>
        total +
        Number(trip.viajes),
      0,
    );

  const totalKilometros =
    trips.reduce(
      (total, trip) =>
        total +
        Number(
          trip.kilometros ?? 0,
        ),
      0,
    );

  const totalHoras =
    machineryHours.reduce(
      (total, operation) =>
        total +
        Number(
          operation.horasUso ?? 0,
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

  const puedeVerDashboard =
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

          <Link
            href="/operaciones"
            className={`${styles.navItem} ${styles.navItemActive}`}
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
              ◈
            </span>

            Combustible
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
              Operaciones
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
                {user?.roles
                  ?.length
                  ? user.roles.join(
                      ", ",
                    )
                  : "FULLTERRA"}
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
                REGISTRO OPERACIONAL
              </p>

              <h2>
                Control de actividad
                diaria
              </h2>

              <p>
                Registra viajes de
                camiones y horas de
                trabajo de maquinaria
                utilizando únicamente
                unidades, empleados y
                actividades
                disponibles.
              </p>
            </div>

            <div
              className={
                styles.summary
              }
            >
              <div>
                <span>
                  Viajes
                </span>

                <strong>
                  {totalViajes}
                </strong>
              </div>

              <div>
                <span>
                  Kilómetros
                </span>

                <strong>
                  {totalKilometros.toLocaleString(
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
                  Horas
                </span>

                <strong>
                  {totalHoras.toLocaleString(
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
                  NUEVA OPERACIÓN
                </p>

                <h3>
                  Registrar actividad
                </h3>
              </div>
            </div>

            <div
              className={
                styles.tabs
              }
            >
              <button
                type="button"
                className={`${styles.tabButton} ${
                  operationMode ===
                  "VIAJE"
                    ? styles.tabButtonActive
                    : ""
                }`}
                onClick={() =>
                  cambiarModo(
                    "VIAJE",
                  )
                }
              >
                Viajes de camión
              </button>

              <button
                type="button"
                className={`${styles.tabButton} ${
                  operationMode ===
                  "MAQUINARIA"
                    ? styles.tabButtonActive
                    : ""
                }`}
                onClick={() =>
                  cambiarModo(
                    "MAQUINARIA",
                  )
                }
              >
                Horas de maquinaria
              </button>
            </div>

            {operationMode ===
            "VIAJE" ? (
              <form
                className={
                  styles.form
                }
                onSubmit={
                  registrarViaje
                }
              >
                <div
                  className={
                    styles.field
                  }
                >
                  <label
                    htmlFor="trip-unit"
                  >
                    Camión
                  </label>

                  <select
                    id="trip-unit"
                    required
                    value={
                      tripForm.unidadId
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        unidadId:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona un
                      camión
                    </option>

                    {camionesDisponibles.map(
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
                    htmlFor="trip-employee"
                  >
                    Empleado
                  </label>

                  <select
                    id="trip-employee"
                    required
                    value={
                      tripForm.empleadoId
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        empleadoId:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona un
                      empleado
                    </option>

                    {empleadosActivos.map(
                      (
                        employee,
                      ) => (
                        <option
                          key={
                            employee.id
                          }
                          value={
                            employee.id
                          }
                        >
                          {
                            employee.nombres
                          }{" "}
                          -{" "}
                          {
                            employee.puesto
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
                    htmlFor="trip-activity"
                  >
                    Actividad
                  </label>

                  <select
                    id="trip-activity"
                    required
                    value={
                      tripForm.tipoActividadId
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        tipoActividadId:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona una
                      actividad
                    </option>

                    {actividadesCamion.map(
                      (
                        activity,
                      ) => (
                        <option
                          key={
                            activity.id
                          }
                          value={
                            activity.id
                          }
                        >
                          {
                            activity.nombre
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
                    htmlFor="trip-date"
                  >
                    Fecha de operación
                  </label>

                  <input
                    id="trip-date"
                    type="date"
                    required
                    value={
                      tripForm.fechaOperacion
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        fechaOperacion:
                          event
                            .target
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
                    htmlFor="trip-count"
                  >
                    Cantidad de viajes
                  </label>

                  <input
                    id="trip-count"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={
                      tripForm.viajes
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        viajes:
                          event
                            .target
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
                    htmlFor="trip-km"
                  >
                    Kilómetros
                  </label>

                  <input
                    id="trip-km"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={
                      tripForm.kilometros
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        kilometros:
                          event
                            .target
                            .value,
                      })
                    }
                  />
                </div>

                <div
                  className={`${styles.field} ${styles.fieldFull}`}
                >
                  <label
                    htmlFor="trip-observations"
                  >
                    Observaciones
                  </label>

                  <textarea
                    id="trip-observations"
                    rows={3}
                    value={
                      tripForm.observaciones
                    }
                    onChange={(
                      event,
                    ) =>
                      setTripForm({
                        ...tripForm,
                        observaciones:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Observaciones opcionales"
                  />
                </div>

                <div
                  className={
                    styles.formActions
                  }
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
                      : "Registrar viaje"}
                  </button>
                </div>
              </form>
            ) : (
              <form
                className={
                  styles.form
                }
                onSubmit={
                  registrarHorasMaquinaria
                }
              >
                <div
                  className={
                    styles.field
                  }
                >
                  <label
                    htmlFor="machinery-unit"
                  >
                    Maquinaria
                  </label>

                  <select
                    id="machinery-unit"
                    required
                    value={
                      machineryForm.unidadId
                    }
                    onChange={(
                      event,
                    ) =>
                      setMachineryForm({
                        ...machineryForm,
                        unidadId:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona
                      maquinaria
                    </option>

                    {maquinariaDisponible.map(
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
                    htmlFor="machinery-employee"
                  >
                    Empleado
                  </label>

                  <select
                    id="machinery-employee"
                    required
                    value={
                      machineryForm.empleadoId
                    }
                    onChange={(
                      event,
                    ) =>
                      setMachineryForm({
                        ...machineryForm,
                        empleadoId:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona un
                      empleado
                    </option>

                    {empleadosActivos.map(
                      (
                        employee,
                      ) => (
                        <option
                          key={
                            employee.id
                          }
                          value={
                            employee.id
                          }
                        >
                          {
                            employee.nombres
                          }{" "}
                          -{" "}
                          {
                            employee.puesto
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
                    htmlFor="machinery-activity"
                  >
                    Actividad
                  </label>

                  <select
                    id="machinery-activity"
                    required
                    value={
                      machineryForm.tipoActividadId
                    }
                    onChange={(
                      event,
                    ) =>
                      setMachineryForm({
                        ...machineryForm,
                        tipoActividadId:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Selecciona una
                      actividad
                    </option>

                    {actividadesMaquinaria.map(
                      (
                        activity,
                      ) => (
                        <option
                          key={
                            activity.id
                          }
                          value={
                            activity.id
                          }
                        >
                          {
                            activity.nombre
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
                    htmlFor="machinery-date"
                  >
                    Fecha de operación
                  </label>

                  <input
                    id="machinery-date"
                    type="date"
                    required
                    value={
                      machineryForm.fechaOperacion
                    }
                    onChange={(
                      event,
                    ) =>
                      setMachineryForm({
                        ...machineryForm,
                        fechaOperacion:
                          event
                            .target
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
                    htmlFor="machinery-hours"
                  >
                    Horas de uso
                  </label>

                  <input
                    id="machinery-hours"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={
                      machineryForm.horasUso
                    }
                    onChange={(
                      event,
                    ) =>
                      setMachineryForm({
                        ...machineryForm,
                        horasUso:
                          event
                            .target
                            .value,
                      })
                    }
                  />
                </div>

                <div
                  className={`${styles.field} ${styles.fieldFull}`}
                >
                  <label
                    htmlFor="machinery-observations"
                  >
                    Observaciones
                  </label>

                  <textarea
                    id="machinery-observations"
                    rows={3}
                    value={
                      machineryForm.observaciones
                    }
                    onChange={(
                      event,
                    ) =>
                      setMachineryForm({
                        ...machineryForm,
                        observaciones:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Observaciones opcionales"
                  />
                </div>

                <div
                  className={
                    styles.formActions
                  }
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
                      : "Registrar horas"}
                  </button>
                </div>
              </form>
            )}

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
                  {operationMode ===
                  "VIAJE"
                    ? "Viajes registrados"
                    : "Horas de maquinaria registradas"}
                </h3>
              </div>

              <span
                className={
                  styles.counter
                }
              >
                {operationMode ===
                "VIAJE"
                  ? `${trips.length} registros`
                  : `${machineryHours.length} registros`}
              </span>
            </div>

            {loadingData ? (
              <div
                className={
                  styles.emptyState
                }
              >
                Cargando operaciones...
              </div>
            ) : operationMode ===
                "VIAJE" ? (
              trips.length === 0 ? (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  No existen viajes
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
                          Observaciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {[...trips]
                        .reverse()
                        .map(
                          (
                            trip,
                          ) => (
                            <tr
                              key={
                                trip.id
                              }
                            >
                              <td>
                                {formatearFecha(
                                  trip.fechaOperacion,
                                )}
                              </td>

                              <td>
                                <strong>
                                  {
                                    trip
                                      .unidad
                                      .codigo
                                  }
                                </strong>
                              </td>

                              <td>
                                {
                                  trip
                                    .empleado
                                    .nombres
                                }
                              </td>

                              <td>
                                {
                                  trip
                                    .actividad
                                    .nombre
                                }
                              </td>

                              <td>
                                {
                                  trip.viajes
                                }
                              </td>

                              <td>
                                {Number(
                                  trip.kilometros ??
                                    0,
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
                                  trip.observaciones ??
                                  "—"
                                }
                              </td>
                            </tr>
                          ),
                        )}
                    </tbody>
                  </table>
                </div>
              )
            ) : machineryHours.length ===
              0 ? (
              <div
                className={
                  styles.emptyState
                }
              >
                No existen horas de
                maquinaria registradas.
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
                        Empleado
                      </th>

                      <th>
                        Actividad
                      </th>

                      <th>
                        Horas
                      </th>

                      <th>
                        Observaciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      ...machineryHours,
                    ]
                      .reverse()
                      .map(
                        (
                          operation,
                        ) => (
                          <tr
                            key={
                              operation.id
                            }
                          >
                            <td>
                              {formatearFecha(
                                operation.fechaOperacion,
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  operation
                                    .unidad
                                    .codigo
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                operation
                                  .empleado
                                  .nombres
                              }
                            </td>

                            <td>
                              {
                                operation
                                  .actividad
                                  .nombre
                              }
                            </td>

                            <td>
                              {Number(
                                operation.horasUso ??
                                  0,
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
                                operation.observaciones ??
                                "—"
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
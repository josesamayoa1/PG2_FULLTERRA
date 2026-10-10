"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./unidades.module.css";

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

type FormMode =
  | "crear"
  | "editar";

type ApiError = {
  message?: string | string[];
};

const initialForm = {
  codigo: "",
  tipo: "CAMION",
  marca: "",
  modelo: "",
  placaOSerie: "",
  estado: "DISPONIBLE",
};

function redirigirSesionExpirada() {
  localStorage.removeItem(
    "fullterra_token",
  );

  window.alert(
    "Tu sesión ha expirado. Inicia sesión nuevamente.",
  );

  window.location.href = "/";
}

export default function UnidadesPage() {
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [
    loadingUnits,
    setLoadingUnits,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [formMode, setFormMode] =
    useState<FormMode>("crear");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState(initialForm);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000";

  const cargarUnidades =
    useCallback(
      async (token: string) => {
        setLoadingUnits(true);
        setError("");

        try {
          const response =
            await fetch(
              `${apiUrl}/units`,
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

          if (
            response.status === 403
          ) {
            setError(
              "No tienes permisos para acceder al módulo de unidades.",
            );

            return;
          }

          if (!response.ok) {
            throw new Error(
              "No fue posible cargar las unidades.",
            );
          }

          const data: Unit[] =
            await response.json();

          setUnits(data);
        } catch (requestError) {
          console.error(
            "Error al cargar unidades:",
            requestError,
          );

          setError(
            "No fue posible cargar las unidades.",
          );
        } finally {
          setLoadingUnits(false);
        }
      },
      [apiUrl],
    );

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

          window.location.href = "/";
          return;
        }

        const profile: UserProfile =
          await response.json();

        if (
          !profile.roles?.includes(
            "Administrador",
          )
        ) {
          window.alert(
            "No tienes permisos para acceder al módulo de unidades.",
          );

          window.location.href =
            "/dashboard";

          return;
        }

        setUser(profile);

        await cargarUnidades(token);
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
    cargarUnidades,
  ]);

  function handleLogout() {
    localStorage.removeItem(
      "fullterra_token",
    );

    window.location.href = "/";
  }

  function resetForm() {
    setForm(initialForm);

    setFormMode("crear");

    setEditingId(null);

    setMessage("");

    setError("");
  }

  function handleEdit(
    unit: Unit,
  ) {
    setFormMode("editar");

    setEditingId(unit.id);

    setForm({
      codigo: unit.codigo,
      tipo: unit.tipo,
      marca: unit.marca,
      modelo: unit.modelo,
      placaOSerie:
        unit.placaOSerie,
      estado: unit.estado,
    });

    setMessage("");

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
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
      const endpoint =
        formMode === "crear"
          ? `${apiUrl}/units`
          : `${apiUrl}/units/${editingId}`;

      const method =
        formMode === "crear"
          ? "POST"
          : "PATCH";

      const body =
        formMode === "crear"
          ? {
              codigo:
                form.codigo,

              tipo:
                form.tipo,

              marca:
                form.marca,

              modelo:
                form.modelo,

              placaOSerie:
                form.placaOSerie,

              estado:
                form.estado,
            }
          : {
              codigo:
                form.codigo,

              marca:
                form.marca,

              modelo:
                form.modelo,

              placaOSerie:
                form.placaOSerie,

              estado:
                form.estado,
            };

      const response =
        await fetch(
          endpoint,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
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
          "No tienes permisos para realizar esta operación.",
        );

        return;
      }

      if (!response.ok) {
        const apiError:
          ApiError =
          await response.json();

        const apiMessage =
          Array.isArray(
            apiError.message,
          )
            ? apiError.message.join(
                " ",
              )
            : apiError.message;

        setError(
          apiMessage ??
            "No fue posible guardar la unidad.",
        );

        return;
      }

      setMessage(
        formMode === "crear"
          ? "Unidad registrada correctamente."
          : "Unidad actualizada correctamente.",
      );

      setForm(initialForm);

      setFormMode("crear");

      setEditingId(null);

      await cargarUnidades(
        token,
      );
    } catch (requestError) {
      console.error(
        "Error al guardar unidad:",
        requestError,
      );

      setError(
        "No fue posible conectar con el servidor.",
      );
    } finally {
      setSaving(false);
    }
  }

  function getStatusClass(
    estado: string,
  ) {
    if (
      estado === "DISPONIBLE"
    ) {
      return styles.statusAvailable;
    }

    if (
      estado ===
      "MANTENIMIENTO"
    ) {
      return styles.statusMaintenance;
    }

    return styles.statusInactive;
  }

  if (checkingSession) {
    return (
      <main
        className={
          styles.loadingPage
        }
      >
        Validando sesión...
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
            width={54}
            height={54}
            className={styles.logo}
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

          <Link
            href="/unidades"
            className={`${styles.navItem} ${styles.navItemActive}`}
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
              ◉
            </span>

            Operaciones
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
          Sistema de control operacional
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
              ADMINISTRACIÓN
            </p>

            <h1>
              Unidades
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
                  "FULLTERRA"}
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
                CONTROL DE FLOTA
              </p>

              <h2>
                Administración de
                unidades
              </h2>

              <p>
                Registra camiones y
                maquinaria, actualiza su
                información y controla su
                estado operativo.
              </p>
            </div>

            <div
              className={
                styles.summary
              }
            >
              <div>
                <span>
                  Total
                </span>

                <strong>
                  {units.length}
                </strong>
              </div>

              <div>
                <span>
                  Disponibles
                </span>

                <strong>
                  {
                    units.filter(
                      (unit) =>
                        unit.estado ===
                        "DISPONIBLE",
                    ).length
                  }
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
                  {formMode ===
                  "crear"
                    ? "NUEVO REGISTRO"
                    : "EDICIÓN"}
                </p>

                <h3>
                  {formMode ===
                  "crear"
                    ? "Registrar unidad"
                    : `Editar ${form.codigo}`}
                </h3>
              </div>

              {formMode ===
                "editar" && (
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    resetForm
                  }
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <form
              className={
                styles.form
              }
              onSubmit={
                handleSubmit
              }
            >
              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="codigo"
                >
                  Código
                </label>

                <input
                  id="codigo"
                  type="text"
                  value={
                    form.codigo
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      codigo:
                        event
                          .target
                          .value,
                    })
                  }
                  placeholder="Ej. CAM-002"
                  required
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="tipo"
                >
                  Tipo
                </label>

                <select
                  id="tipo"
                  value={
                    form.tipo
                  }
                  disabled={
                    formMode ===
                    "editar"
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      tipo:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  <option value="CAMION">
                    Camión
                  </option>

                  <option value="MAQUINARIA">
                    Maquinaria
                  </option>
                </select>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="marca"
                >
                  Marca
                </label>

                <input
                  id="marca"
                  type="text"
                  value={
                    form.marca
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      marca:
                        event
                          .target
                          .value,
                    })
                  }
                  placeholder="Ej. International"
                  required
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="modelo"
                >
                  Modelo
                </label>

                <input
                  id="modelo"
                  type="text"
                  value={
                    form.modelo
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      modelo:
                        event
                          .target
                          .value,
                    })
                  }
                  placeholder="Ej. 7600"
                  required
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="placaOSerie"
                >
                  Placa o serie
                </label>

                <input
                  id="placaOSerie"
                  type="text"
                  value={
                    form.placaOSerie
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      placaOSerie:
                        event
                          .target
                          .value,
                    })
                  }
                  placeholder="Ej. C123BCD"
                  required
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="estado"
                >
                  Estado
                </label>

                <select
                  id="estado"
                  value={
                    form.estado
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      estado:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  <option value="DISPONIBLE">
                    Disponible
                  </option>

                  <option value="MANTENIMIENTO">
                    Mantenimiento
                  </option>

                  <option value="INACTIVO">
                    Inactivo
                  </option>
                </select>
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
                    : formMode ===
                        "crear"
                      ? "Registrar unidad"
                      : "Guardar cambios"}
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
                  FLOTA REGISTRADA
                </p>

                <h3>
                  Camiones y
                  maquinaria
                </h3>
              </div>

              <span
                className={
                  styles.counter
                }
              >
                {units.length}{" "}
                unidades
              </span>
            </div>

            {loadingUnits ? (
              <div
                className={
                  styles.emptyState
                }
              >
                Cargando unidades...
              </div>
            ) : units.length ===
              0 ? (
              <div
                className={
                  styles.emptyState
                }
              >
                No existen unidades
                registradas.
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
                        Código
                      </th>

                      <th>
                        Tipo
                      </th>

                      <th>
                        Marca /
                        Modelo
                      </th>

                      <th>
                        Placa /
                        Serie
                      </th>

                      <th>
                        Estado
                      </th>

                      <th>
                        Activo
                      </th>

                      <th>
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {units.map(
                      (unit) => (
                        <tr
                          key={
                            unit.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                unit.codigo
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              unit.tipo
                            }
                          </td>

                          <td>
                            {
                              unit.marca
                            }{" "}
                            {
                              unit.modelo
                            }
                          </td>

                          <td>
                            {
                              unit.placaOSerie
                            }
                          </td>

                          <td>
                            <span
                              className={`${styles.statusBadge} ${getStatusClass(
                                unit.estado,
                              )}`}
                            >
                              {
                                unit.estado
                              }
                            </span>
                          </td>

                          <td>
                            {unit.activo
                              ? "Sí"
                              : "No"}
                          </td>

                          <td>
                            <button
                              type="button"
                              className={
                                styles.editButton
                              }
                              onClick={() =>
                                handleEdit(
                                  unit,
                                )
                              }
                            >
                              Editar
                            </button>
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
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import styles from "./dashboard.module.css";

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

type UnitDashboard = {
  unidad: Unit;
  viajes: number;
  kilometros: number;
  horasMaquinaria: number;
  galonesCombustible: number;
  mantenimientos: number;
};

type DashboardData = {
  periodo: unknown;

  resumen: {
    viajes: number;
    kilometros: number;
    horasMaquinaria: number;
    galonesCombustible: number;
    mantenimientos: number;
  };

  variacionMesAnterior: {
    viajes: number;
    kilometros: number;
    horasMaquinaria: number;
    galonesCombustible: number;
    mantenimientos: number;
  };

  unidades: UnitDashboard[];
};

export default function DashboardPage() {
  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [
    dashboardData,
    setDashboardData,
  ] =
    useState<DashboardData | null>(
      null,
    );

  const [
    dashboardError,
    setDashboardError,
  ] = useState(false);

  const [
    periodoTexto,
    setPeriodoTexto,
  ] = useState("");

  useEffect(() => {
    async function cargarDashboard() {
      const token =
        localStorage.getItem(
          "fullterra_token",
        );

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const apiUrl =
          process.env
            .NEXT_PUBLIC_API_URL ??
          "http://localhost:3000";

        const profileResponse =
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
          !profileResponse.ok
        ) {
          localStorage.removeItem(
            "fullterra_token",
          );

          window.location.href =
            "/";

          return;
        }

        const profile:
          UserProfile =
          await profileResponse.json();

        setUser(profile);

        const fechaActual =
          new Date();

        const anio =
          fechaActual.getFullYear();

        const mes =
          fechaActual.getMonth() + 1;

        const dia =
          fechaActual.getDate();

        const fechaInicio =
          new Date(
            anio,
            mes - 1,
            1,
          );

        const formatoFecha =
          new Intl.DateTimeFormat(
            "es-GT",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            },
          );

        setPeriodoTexto(
          `${formatoFecha.format(
            fechaInicio,
          )} - ${formatoFecha.format(
            fechaActual,
          )}`,
        );

        const dashboardResponse =
          await fetch(
            `${apiUrl}/dashboard?anio=${anio}&mes=${mes}&dia=${dia}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (
          !dashboardResponse.ok
        ) {
          setDashboardError(true);
          return;
        }

        const data:
          DashboardData =
          await dashboardResponse.json();

        setDashboardData(data);
      } catch (error) {
        console.error(
          "Error al cargar dashboard:",
          error,
        );

        setDashboardError(true);
      } finally {
        setCheckingSession(false);
      }
    }

    cargarDashboard();
  }, []);

  function handleLogout() {
    localStorage.removeItem(
      "fullterra_token",
    );

    window.location.href = "/";
  }

  function formatNumber(
    value:
      | number
      | undefined,
  ) {
    if (
      value === undefined
    ) {
      return "—";
    }

    return value.toLocaleString(
      "es-GT",
      {
        maximumFractionDigits: 2,
      },
    );
  }

  const unidades =
    dashboardData?.unidades ??
    [];

  const unidadesDisponibles =
    unidades.filter(
      (registro) =>
        registro.unidad.estado ===
        "DISPONIBLE",
    ).length;

  const unidadesMantenimiento =
    unidades.filter(
      (registro) =>
        registro.unidad.estado ===
        "MANTENIMIENTO",
    ).length;

  const unidadesInactivas =
    unidades.filter(
      (registro) =>
        registro.unidad.estado ===
        "INACTIVO",
    ).length;

  if (checkingSession) {
    return (
      <main
        className={styles.page}
      >
        <section
          style={{
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            background:
              "#f4f5f3",
            color: "#000000",
            fontWeight: 700,
          }}
        >
          Cargando información...
        </section>
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
          <button
            type="button"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span
              className={
                styles.navIcon
              }
            >
              ▦
            </span>

            Dashboard
          </button>

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
              PANEL DE CONTROL
            </p>

            <h1>
              Dashboard
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
            styles.dashboard
          }
        >
          <section
            className={
              styles.welcome
            }
          >
            <div>
              <p
                className={
                  styles.welcomeLabel
                }
              >
                RESUMEN OPERACIONAL
              </p>

              <h2>
                Bienvenido al sistema
                FULLTERRA
              </h2>

              <p>
                Consulta el estado
                general de las
                operaciones, unidades,
                combustible y
                mantenimiento.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                className={
                  styles.status
                }
              >
                Período:{" "}
                {periodoTexto ||
                  "—"}
              </div>

              <div
                className={
                  styles.status
                }
              >
                <span
                  className={
                    styles.statusDot
                  }
                />

                Sistema activo
              </div>
            </div>
          </section>

          {dashboardError && (
            <p
              style={{
                marginTop:
                  "20px",
                padding:
                  "14px 16px",
                border:
                  "1px solid #dedede",
                borderRadius:
                  "8px",
                background:
                  "#ffffff",
                color:
                  "#000000",
                fontSize:
                  "13px",
                fontWeight: 600,
              }}
            >
              No fue posible cargar
              la información del
              dashboard.
            </p>
          )}

          <section
            className={
              styles.cards
            }
          >
            <article
              className={
                styles.card
              }
            >
              <div
                className={
                  styles.cardHeader
                }
              >
                <span>
                  Viajes realizados
                </span>

                <span
                  className={
                    styles.cardIcon
                  }
                >
                  ↗
                </span>
              </div>

              <strong>
                {formatNumber(
                  dashboardData
                    ?.resumen
                    .viajes,
                )}
              </strong>

              <p>
                {periodoTexto ||
                  "Período actual"}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <div
                className={
                  styles.cardHeader
                }
              >
                <span>
                  Kilómetros
                  recorridos
                </span>

                <span
                  className={
                    styles.cardIcon
                  }
                >
                  ⟷
                </span>
              </div>

              <strong>
                {formatNumber(
                  dashboardData
                    ?.resumen
                    .kilometros,
                )}
              </strong>

              <p>
                Acumulado del
                período
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <div
                className={
                  styles.cardHeader
                }
              >
                <span>
                  Horas de
                  maquinaria
                </span>

                <span
                  className={
                    styles.cardIcon
                  }
                >
                  ◷
                </span>
              </div>

              <strong>
                {formatNumber(
                  dashboardData
                    ?.resumen
                    .horasMaquinaria,
                )}
              </strong>

              <p>
                Operación registrada
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <div
                className={
                  styles.cardHeader
                }
              >
                <span>
                  Combustible
                </span>

                <span
                  className={
                    styles.cardIcon
                  }
                >
                  ◉
                </span>
              </div>

              <strong>
                {formatNumber(
                  dashboardData
                    ?.resumen
                    .galonesCombustible,
                )}
              </strong>

              <p>
                Galones registrados
              </p>
            </article>
          </section>

          <section
            className={
              styles.grid
            }
          >
            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.panelLabel
                    }
                  >
                    UNIDADES
                  </span>

                  <h3>
                    Actividad por
                    unidad
                  </h3>
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "12px",
                  paddingTop:
                    "18px",
                }}
              >
                {unidades.length ===
                0 ? (
                  <div
                    className={
                      styles.emptyState
                    }
                  >
                    <strong>
                      Sin información
                    </strong>

                    <p>
                      No existen
                      unidades
                      registradas para
                      el período.
                    </p>
                  </div>
                ) : (
                  unidades.map(
                    (registro) => (
                      <div
                        key={
                          registro
                            .unidad.id
                        }
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1.4fr repeat(5, 1fr)",
                          gap: "12px",
                          alignItems:
                            "center",
                          padding:
                            "14px 16px",
                          border:
                            "1px solid #e6e6e6",
                          borderRadius:
                            "9px",
                          background:
                            "#fafafa",
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display:
                                "block",
                              fontSize:
                                "13px",
                            }}
                          >
                            {
                              registro
                                .unidad
                                .codigo
                            }
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#777777",
                              fontSize:
                                "11px",
                            }}
                          >
                            {
                              registro
                                .unidad
                                .marca
                            }{" "}
                            {
                              registro
                                .unidad
                                .modelo
                            }
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatNumber(
                              registro
                                .viajes,
                            )}
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#888888",
                              fontSize:
                                "10px",
                            }}
                          >
                            Viajes
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatNumber(
                              registro
                                .kilometros,
                            )}
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#888888",
                              fontSize:
                                "10px",
                            }}
                          >
                            Km
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatNumber(
                              registro
                                .horasMaquinaria,
                            )}
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#888888",
                              fontSize:
                                "10px",
                            }}
                          >
                            Horas
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatNumber(
                              registro
                                .galonesCombustible,
                            )}
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#888888",
                              fontSize:
                                "10px",
                            }}
                          >
                            Galones
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatNumber(
                              registro
                                .mantenimientos,
                            )}
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#888888",
                              fontSize:
                                "10px",
                            }}
                          >
                            Mant.
                          </span>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </article>

            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.panelLabel
                    }
                  >
                    ESTADO DE FLOTA
                  </span>

                  <h3>
                    Estado de unidades
                  </h3>
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: "13px",
                  paddingTop:
                    "22px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "15px 16px",
                    border:
                      "1px solid #e6e6e6",
                    borderRadius:
                      "9px",
                    background:
                      "#fafafa",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "12px",
                      fontWeight: 700,
                    }}
                  >
                    Disponibles
                  </span>

                  <strong>
                    {
                      unidadesDisponibles
                    }
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "15px 16px",
                    border:
                      "1px solid #e6e6e6",
                    borderRadius:
                      "9px",
                    background:
                      "#fafafa",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "12px",
                      fontWeight: 700,
                    }}
                  >
                    En mantenimiento
                  </span>

                  <strong>
                    {
                      unidadesMantenimiento
                    }
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "15px 16px",
                    border:
                      "1px solid #e6e6e6",
                    borderRadius:
                      "9px",
                    background:
                      "#fafafa",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "12px",
                      fontWeight: 700,
                    }}
                  >
                    Inactivas
                  </span>

                  <strong>
                    {
                      unidadesInactivas
                    }
                  </strong>
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",
                    padding:
                      "17px 16px",
                    border:
                      "1px solid #e6e6e6",
                    borderRadius:
                      "9px",
                    background:
                      "#ffffff",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#777777",
                      fontSize:
                        "11px",
                    }}
                  >
                    Mantenimientos del
                    período
                  </span>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "7px",
                      fontSize:
                        "25px",
                    }}
                  >
                    {formatNumber(
                      dashboardData
                        ?.resumen
                        .mantenimientos,
                    )}
                  </strong>
                </div>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
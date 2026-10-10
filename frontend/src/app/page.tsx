"use client";

import Image from "next/image";
import {
  FormEvent,
  useState,
} from "react";

import styles from "./page.module.css";

export default function Home() {
  const [loading, setLoading] =
    useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const usuario =
      formData.get("usuario");

    const contrasenia =
      formData.get("contrasenia");

    if (
      typeof usuario !== "string" ||
      typeof contrasenia !== "string"
    ) {
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:3000";

      const response = await fetch(
        `${apiUrl}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            usuario,
            contrasenia,
          }),
        },
      );

      if (!response.ok) {
        window.alert(
          "Usuario o contraseña incorrectos.",
        );

        return;
      }

      const data: {
        access_token: string;
      } = await response.json();

      localStorage.setItem(
        "fullterra_token",
        data.access_token,
      );

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error,
      );

      window.alert(
        "No fue posible conectar con el servidor.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div
            className={
              styles.logoContainer
            }
          >
            <Image
              className={
                styles.companyLogo
              }
              src="/images/fullterra-logo.jpeg"
              alt="Logo de FULLTERRA"
              width={84}
              height={84}
              priority
            />
          </div>

          <span
            className={styles.brandName}
          >
            FULLTERRA
          </span>
        </div>

        <form
          className={styles.loginForm}
          onSubmit={handleLogin}
        >
          <div
            className={styles.loginField}
          >
            <div
              className={styles.fieldIcon}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <input
              id="usuario"
              name="usuario"
              type="text"
              placeholder="Usuario"
              autoComplete="username"
              aria-label="Usuario"
              required
            />
          </div>

          <div
            className={styles.loginField}
          >
            <div
              className={styles.fieldIcon}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <input
              id="contrasenia"
              name="contrasenia"
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              aria-label="Contraseña"
              required
            />
          </div>

          <button
            type="submit"
            className={
              styles.loginButton
            }
            disabled={loading}
          >
            <span>
              {loading
                ? "Ingresando..."
                : "Ingresar"}
            </span>

            {!loading && (
              <span
                className={styles.arrow}
                aria-hidden="true"
              >
                →
              </span>
            )}
          </button>
        </form>
      </header>

      <section className={styles.hero}>
        <div
          className={styles.heroOverlay}
        >
          <div
            className={
              styles.messageCard
            }
          >
            <h1>
              Gestión eficiente para
              operaciones de construcción.
            </h1>

            <p>
              Sistema de control
              operacional, mantenimiento,
              trazabilidad e indicadores
              para camiones y maquinaria.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
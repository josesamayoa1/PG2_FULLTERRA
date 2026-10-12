"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./administracion-accesos.module.css";

type Profile = { id: number; usuario: string; roles?: string[] };
type Role = { id: number; nombre: string; descripcion?: string | null; activo: boolean };
type Account = { id: number; usuario: string; activo: boolean; roles: Role[] };
type ApiError = { message?: string | string[] };
type Tab = "usuarios" | "roles";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function messageOf(data: ApiError, fallback: string) {
  return Array.isArray(data.message) ? data.message.join(", ") : data.message || fallback;
}
function signOut(expired = false) {
  localStorage.removeItem("fullterra_token");
  if (expired) window.alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
  window.location.href = "/";
}
async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (response.status === 401) { signOut(true); throw new Error("Sesión expirada"); }
  if (!response.ok) {
    const data: ApiError = await response.json().catch(() => ({}));
    throw new Error(messageOf(data, `Error HTTP ${response.status}`));
  }
  return response.json() as Promise<T>;
}

export default function AdministracionAccesosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("usuarios");
  const [users, setUsers] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [newUser, setNewUser] = useState({ usuario: "", contrasenia: "" });
  const [newRole, setNewRole] = useState({ nombre: "", descripcion: "" });
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const loadData = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const [accounts, availableRoles] = await Promise.all([
        request<Account[]>("/users", token), request<Role[]>("/roles", token),
      ]);
      setUsers(accounts);
      setRoles(availableRoles);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      const token = localStorage.getItem("fullterra_token");
      if (!token) { signOut(); return; }
      try {
        const current = await request<Profile>("/auth/profile", token);
        if (!current.roles?.includes("Administrador")) {
          window.alert("No tienes permisos para administrar accesos.");
          window.location.href = "/dashboard";
          return;
        }
        if (mounted) setProfile(current);
        await loadData(token);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "No fue posible cargar la información.");
      } finally { if (mounted) setChecking(false); }
    }
    void initialize();
    return () => { mounted = false; };
  }, [loadData]);

  async function run(action: (token: string) => Promise<unknown>, success: string) {
    const token = localStorage.getItem("fullterra_token");
    if (!token) { signOut(); return false; }
    setBusy(true); setError(""); setNotice("");
    try {
      await action(token);
      await loadData(token);
      setNotice(success);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la operación.");
      return false;
    } finally { setBusy(false); }
  }

  function editUser(user: Account) {
    setEditingUser(user.id);
    setUserName(user.usuario);
    setPassword("");
    setSelectedRoles(user.roles.map((role) => role.id));
    setError(""); setNotice("");
  }
  function editRole(role: Role) {
    setEditingRole(role.id);
    setRoleName(role.nombre);
    setRoleDescription(role.descripcion ?? "");
    setError(""); setNotice("");
  }
  const filteredUsers = users.filter((user) =>
    `${user.usuario} ${user.roles.map((role) => role.nombre).join(" ")}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
  );
  const filteredRoles = roles.filter((role) =>
    `${role.nombre} ${role.descripcion ?? ""}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
  );

  if (checking) return <main className={styles.loadingPage}>Validando acceso...</main>;
  if (!profile) return <main className={styles.loadingPage}>{error || "Redirigiendo..."}</main>;

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Image src="/images/fullterra-logo.jpeg" alt="Logo de FULLTERRA" width={48} height={48} className={styles.logo} priority />
          <span className={styles.brandName}>FULLTERRA</span>
        </div>
        <nav className={styles.navigation}>
          <Link href="/dashboard" className={styles.navItem}><span className={styles.navIcon}>▦</span>Dashboard</Link>
          <Link href="/unidades" className={styles.navItem}><span className={styles.navIcon}>▣</span>Unidades</Link>
          <Link href="/operaciones" className={styles.navItem}><span className={styles.navIcon}>◉</span>Operaciones</Link>
          <Link href="/combustible" className={styles.navItem}><span className={styles.navIcon}>◈</span>Combustible</Link>
          <Link href="/mantenimiento" className={styles.navItem}><span className={styles.navIcon}>◇</span>Mantenimiento</Link>
          <Link href="/alertas-mantenimiento" className={styles.navItem}><span className={styles.navIcon}>!</span>Alertas</Link>
          <Link href="/trazabilidad" className={styles.navItem}><span className={styles.navIcon}>≡</span>Trazabilidad</Link>
          <Link href="/indicadores" className={styles.navItem}><span className={styles.navIcon}>◫</span>Indicadores</Link>
          <Link href="/auditoria" className={styles.navItem}><span className={styles.navIcon}>☷</span>Auditoría</Link>
          <Link href="/administracion-accesos" className={`${styles.navItem} ${styles.navItemActive}`} aria-current="page"><span className={styles.navIcon}>⚙</span>Administración de accesos</Link>
        </nav>
        <div className={styles.sidebarFooter}>Sistema de control operacional</div>
      </aside>
      <section className={styles.content}>
        <header className={styles.topbar}>
          <div><p className={styles.sectionLabel}>CONTROL OPERACIONAL</p><h1>Administración de accesos</h1></div>
          <div className={styles.userArea}>
            <div className={styles.userAvatar}>{profile.usuario.charAt(0).toUpperCase()}</div>
            <div className={styles.userInfo}><strong>{profile.usuario}</strong><span>{profile.roles?.join(", ")}</span></div>
            <button type="button" className={styles.logoutButton} onClick={() => signOut()}>Cerrar sesión</button>
          </div>
        </header>
        <div className={styles.workspace}>
          <section className={styles.intro}>
            <p className={styles.panelLabel}>SEGURIDAD Y PERMISOS</p>
            <h2>Gestión de usuarios y roles</h2>
            <p>Administra las cuentas, los permisos y el acceso al sistema.</p>
          </section>
          <div className={styles.tabs} role="tablist" aria-label="Secciones de administración">
            <button type="button" role="tab" aria-selected={tab === "usuarios"} className={tab === "usuarios" ? styles.tabActive : styles.tab} onClick={() => { setTab("usuarios"); setSearch(""); setError(""); setNotice(""); }}>Usuarios ({users.length})</button>
            <button type="button" role="tab" aria-selected={tab === "roles"} className={tab === "roles" ? styles.tabActive : styles.tab} onClick={() => { setTab("roles"); setSearch(""); setError(""); setNotice(""); }}>Roles ({roles.length})</button>
          </div>
          {error && <div className={styles.errorMessage} role="alert">{error}</div>}
          {notice && <div className={styles.successMessage} role="status">{notice}</div>}
          {tab === "usuarios" ? <>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.panelLabel}>NUEVA CUENTA</p><h3>Crear usuario</h3></div></div>
              <form className={styles.form} onSubmit={async (event) => {
                event.preventDefault();
                const ok = await run((token) => request("/users", token, { method: "POST", body: JSON.stringify(newUser) }), "Usuario creado correctamente.");
                if (ok) setNewUser({ usuario: "", contrasenia: "" });
              }}>
                <label className={styles.field}>Usuario<input required autoComplete="off" value={newUser.usuario} onChange={(event) => setNewUser({ ...newUser, usuario: event.target.value })} /></label>
                <label className={styles.field}>Contraseña inicial<input required type="password" autoComplete="new-password" value={newUser.contrasenia} onChange={(event) => setNewUser({ ...newUser, contrasenia: event.target.value })} /></label>
                <button className={styles.primaryButton} disabled={busy} type="submit">Crear usuario</button>
              </form>
              <p className={styles.hint}>Después de crear la cuenta, asígnale los roles correspondientes desde la lista.</p>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.panelLabel}>CUENTAS REGISTRADAS</p><h3>Usuarios del sistema</h3></div><button type="button" className={styles.secondaryButton} disabled={busy || loading} onClick={() => { const token = localStorage.getItem("fullterra_token"); if (token) void loadData(token).catch((e) => setError(String(e))); }}>Actualizar</button></div>
              <label className={styles.field}>Buscar usuario<input placeholder="Nombre o rol" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              {loading ? <p className={styles.emptyState}>Cargando usuarios...</p> : filteredUsers.length === 0 ? <p className={styles.emptyState}>No se encontraron usuarios.</p> : <div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Usuario</th><th>Roles</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
                {filteredUsers.map((user) => <tr key={user.id}><td><strong>{user.usuario}</strong><small>#{user.id}</small></td><td>{user.roles.map((role) => role.nombre).join(", ") || "Sin roles"}</td><td><span className={user.activo ? styles.activeBadge : styles.inactiveBadge}>{user.activo ? "Activo" : "Inactivo"}</span></td><td><div className={styles.actions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => editUser(user)}>Editar</button>
                  <button type="button" className={styles.secondaryButton} disabled={busy || user.id === profile.id} title={user.id === profile.id ? "No puedes desactivar tu propia cuenta" : undefined} onClick={async () => {
                    if (!window.confirm(`¿${user.activo ? "Desactivar" : "Activar"} la cuenta ${user.usuario}?`)) return;
                    await run((token) => request(`/users/${user.id}/estado`, token, { method: "PATCH", body: JSON.stringify({ activo: !user.activo }) }), "Estado de la cuenta actualizado.");
                  }}>{user.activo ? "Desactivar" : "Activar"}</button>
                </div></td></tr>)}
              </tbody></table></div>}
            </section>
            {editingUser !== null && <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.panelLabel}>EDITAR CUENTA</p><h3>{users.find((u) => u.id === editingUser)?.usuario}</h3></div><button type="button" className={styles.secondaryButton} onClick={() => setEditingUser(null)}>Cerrar</button></div>
              <form className={styles.form} onSubmit={async (event) => {
                event.preventDefault();
                const payload: { usuario: string; contrasenia?: string } = { usuario: userName };
                if (password) payload.contrasenia = password;
                const ok = await run((token) => request(`/users/${editingUser}`, token, { method: "PATCH", body: JSON.stringify(payload) }), "Datos del usuario actualizados.");
                if (ok) setPassword("");
              }}>
                <label className={styles.field}>Nombre de usuario<input required value={userName} onChange={(event) => setUserName(event.target.value)} /></label>
                <label className={styles.field}>Nueva contraseña (opcional)<input type="password" autoComplete="new-password" placeholder="Dejar vacío para no cambiar" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                <button type="submit" className={styles.primaryButton} disabled={busy}>Guardar datos</button>
              </form>
              <div className={styles.roleEditor}><h3>Roles asignados</h3><div className={styles.checkList}>
                {roles.filter((role) => role.activo).map((role) => <label key={role.id} className={styles.checkItem}><input type="checkbox" disabled={busy || editingUser === profile.id} checked={selectedRoles.includes(role.id)} onChange={(event) => setSelectedRoles((previous) => event.target.checked ? [...previous, role.id] : previous.filter((id) => id !== role.id))} />{role.nombre}</label>)}
              </div><button type="button" className={styles.primaryButton} disabled={busy || editingUser === profile.id} onClick={() => void run((token) => request(`/users/${editingUser}/roles`, token, { method: "PATCH", body: JSON.stringify({ roles: selectedRoles }) }), "Roles actualizados correctamente.")}>Guardar roles</button>
              {editingUser === profile.id && <p className={styles.hint}>Por seguridad, no puedes modificar tus propios roles.</p>}
              </div>
            </section>}
          </> : <>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.panelLabel}>NUEVO ROL</p><h3>Crear rol</h3></div></div>
              <form className={styles.form} onSubmit={async (event) => {
                event.preventDefault();
                const ok = await run((token) => request("/roles", token, { method: "POST", body: JSON.stringify(newRole) }), "Rol creado correctamente.");
                if (ok) setNewRole({ nombre: "", descripcion: "" });
              }}>
                <label className={styles.field}>Nombre<input required value={newRole.nombre} onChange={(event) => setNewRole({ ...newRole, nombre: event.target.value })} /></label>
                <label className={styles.field}>Descripción<input value={newRole.descripcion} onChange={(event) => setNewRole({ ...newRole, descripcion: event.target.value })} /></label>
                <button type="submit" className={styles.primaryButton} disabled={busy}>Crear rol</button>
              </form>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.panelLabel}>PERMISOS DEL SISTEMA</p><h3>Roles registrados</h3></div></div>
              <label className={styles.field}>Buscar rol<input placeholder="Nombre o descripción" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              {loading ? <p className={styles.emptyState}>Cargando roles...</p> : filteredRoles.length === 0 ? <p className={styles.emptyState}>No se encontraron roles.</p> : <div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Rol</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
                {filteredRoles.map((role) => <tr key={role.id}><td><strong>{role.nombre}</strong><small>#{role.id}</small></td><td>{role.descripcion || "—"}</td><td><span className={role.activo ? styles.activeBadge : styles.inactiveBadge}>{role.activo ? "Activo" : "Inactivo"}</span></td><td><div className={styles.actions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => editRole(role)}>Editar</button>
                  <button type="button" className={styles.secondaryButton} disabled={busy || role.nombre === "Administrador"} onClick={async () => {
                    if (!window.confirm(`¿${role.activo ? "Desactivar" : "Activar"} el rol ${role.nombre}?`)) return;
                    await run((token) => request(`/roles/${role.id}/estado`, token, { method: "PATCH", body: JSON.stringify({ activo: !role.activo }) }), "Estado del rol actualizado.");
                  }}>{role.activo ? "Desactivar" : "Activar"}</button>
                </div></td></tr>)}
              </tbody></table></div>}
            </section>
            {editingRole !== null && <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.panelLabel}>EDITAR ROL</p><h3>{roles.find((r) => r.id === editingRole)?.nombre}</h3></div><button type="button" className={styles.secondaryButton} onClick={() => setEditingRole(null)}>Cerrar</button></div>
              <form className={styles.form} onSubmit={async (event) => {
                event.preventDefault();
                await run((token) => request(`/roles/${editingRole}`, token, { method: "PATCH", body: JSON.stringify({ nombre: roleName, descripcion: roleDescription }) }), "Rol actualizado correctamente.");
              }}>
                <label className={styles.field}>Nombre<input required disabled={roles.some((r) => r.id === editingRole && r.nombre === "Administrador")} value={roleName} onChange={(event) => setRoleName(event.target.value)} /></label>
                <label className={styles.field}>Descripción<input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} /></label>
                <button type="submit" className={styles.primaryButton} disabled={busy}>Guardar cambios</button>
              </form>
            </section>}
          </>}
        </div>
      </section>
    </main>
  );
}

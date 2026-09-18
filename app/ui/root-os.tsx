"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function RootWindow({ title, icon, menu = ["File", "View", "Tools", "Help"], toolbar, status, children, className = "" }: {
  title: string;
  icon?: ReactNode;
  menu?: string[];
  toolbar?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`os-window ${className}`}>
    <RootTitleBar title={title} icon={icon} />
    <RootMenuBar items={menu} />
    {toolbar && <RootToolbar>{toolbar}</RootToolbar>}
    <div className="os-window-body">{children}</div>
    {status && <RootStatusBar>{status}</RootStatusBar>}
  </section>;
}

export function RootTitleBar({ title, icon }: { title: string; icon?: ReactNode }) {
  return <header className="os-titlebar">
    <span className="os-title-icon" aria-hidden="true">{icon ?? "N"}</span>
    <strong>{title}</strong>
    <div className="os-window-controls" aria-label="Window controls">
      <button type="button" aria-label="Minimize">_</button>
      <button type="button" aria-label="Maximize">□</button>
      <button type="button" aria-label="Close">×</button>
    </div>
  </header>;
}

export function RootMenuBar({ items }: { items: string[] }) {
  return <nav className="os-menubar" aria-label="Application menu">
    {items.map((item) => <button type="button" key={item}>{item}</button>)}
  </nav>;
}

export function RootToolbar({ children }: { children: ReactNode }) {
  return <div className="os-toolbar">{children}</div>;
}

export function RootStatusBar({ children }: { children: ReactNode }) {
  return <footer className="os-statusbar">{children}</footer>;
}

export function RootButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`os-button ${className}`} {...props} />;
}

export function RootInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`os-input ${className}`} {...props} />;
}

export function RootSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`os-select ${className}`} {...props} />;
}

export function RootTabs({ items, active, onChange, label }: { items: Array<{ id: string; label: string }>; active: string; onChange: (id: string) => void; label: string }) {
  return <div className="os-tabs" role="tablist" aria-label={label}>
    {items.map((item) => <button type="button" role="tab" aria-selected={active === item.id} className={active === item.id ? "active" : ""} key={item.id} onClick={() => onChange(item.id)}>{item.label}</button>)}
  </div>;
}

export function RootPane({ title, actions, children, className = "", ...props }: HTMLAttributes<HTMLElement> & { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return <section className={`os-pane ${className}`} {...props}>
    {title && <header className="os-pane-title"><span>{title}</span>{actions}</header>}
    <div className="os-pane-content">{children}</div>
  </section>;
}

export function RootTree({ title, children, footer }: { title?: string; children: ReactNode; footer?: ReactNode }) {
  return <aside className="os-tree">
    {title && <header>{title}</header>}
    <nav>{children}</nav>
    {footer && <footer>{footer}</footer>}
  </aside>;
}

export function RootTable({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`os-table-scroll ${className}`}><table className="os-table">{children}</table></div>;
}

export function RootEmpty({ children }: { children: ReactNode }) {
  return <p className="os-empty">{children}</p>;
}


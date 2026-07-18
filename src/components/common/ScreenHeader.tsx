import type { ReactNode } from 'react';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function ScreenHeader({ title, subtitle, actions }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header-left">
        <h1 className="screen-title">{title}</h1>
        {subtitle && <span className="screen-subtitle">{subtitle}</span>}
      </div>
      {actions && <div className="screen-actions">{actions}</div>}
    </header>
  );
}

import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { playSoundEffect } from '../../lib/audio/audioManager';

type Variant = 'default' | 'primary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  default: '',
  primary: 'btn-primary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button({ variant = 'default', size = 'md', className = '', onClick, ...rest }: ButtonProps) {
  const classes = ['btn', variantClass[variant], size === 'sm' ? 'btn-sm' : '', className]
    .filter(Boolean)
    .join(' ');

  // Centralized UI click SE - every button in the app goes through here, so
  // individual screens never need to remember to play it themselves. A
  // disabled <button> never fires click events, so this can't play for
  // disabled buttons.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    playSoundEffect('uiClick');
    onClick?.(event);
  };

  return <button className={classes} onClick={handleClick} {...rest} />;
}

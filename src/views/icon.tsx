import { iconSvg, type IconName } from '../generated/icons';

/**
 * Renders an application icon from the generated SVG catalog.
 * @param props - Icon name, accessible label, and CSS class name.
 * @returns Inline SVG markup for the selected icon.
 */
export function Icon({
  name,
  label,
  className = 'size-4',
}: {
  name: IconName;
  label?: string;
  className?: string;
}) {
  return (
    <span
      class={`${className} flex items-center`}
      aria-hidden={label === undefined ? 'true' : undefined}
      aria-label={label}
      role={label === undefined ? undefined : 'img'}
      dangerouslySetInnerHTML={{ __html: iconSvg[name] }}
    />
  );
}

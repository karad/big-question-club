import { iconSvg, type IconName } from '../generated/icons';

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
      class={className}
      aria-hidden={label === undefined ? 'true' : undefined}
      aria-label={label}
      role={label === undefined ? undefined : 'img'}
      dangerouslySetInnerHTML={{ __html: iconSvg[name] }}
    />
  );
}

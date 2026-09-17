import { Box, Typography } from '@strapi/design-system';

// Renders a Font Awesome icon as inline SVG from metadata (no webfonts/CSS).
// `path` is an array: one entry for single-layer icons, two for duotone
// ([secondary, primary]).
const FaSvg = ({ icon, size = 25 }) => {
  const path = icon && icon.path;
  if (!path || (Array.isArray(path) && path.length === 0)) {
    // Fallback when no path is available: show initials.
    return (
      <Box width={`${size}px`} height={`${size}px`} display="grid" style={{ placeItems: 'center' }}>
        <Typography variant="pi" textColor="neutral500">
          {(icon?.name || '?').slice(0, 2)}
        </Typography>
      </Box>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      {Array.isArray(path) ? (
        // Duotone: secondary layer (index 0) at reduced opacity.
        path.map((d, i) => <path key={i} d={d} opacity={path.length > 1 && i === 0 ? 0.4 : 1} />)
      ) : (
        <path d={path} />
      )}
    </svg>
  );
};

export default FaSvg;

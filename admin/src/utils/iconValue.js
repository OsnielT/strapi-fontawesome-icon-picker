// Pure encode/decode of the field's stored value. No React, no side effects.

// Encode a picked icon into the field's configured output format.
export const formatValue = (icon, format) => {
  switch (format) {
    case 'name':
      return icon.name; // e.g. "user"
    case 'object':
      return JSON.stringify({
        name: icon.name,
        family: icon.family,
        style: icon.style,
        prefix: icon.prefix,
        id: icon.id,
        label: icon.label,
      });
    case 'class':
    default:
      return icon.id; // e.g. "fa-solid fa-user"
  }
};

// Interpret a stored value (any output format) back into { name, id } so the
// picker can render the preview and highlight the selected cell.
export const parseStored = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      return { name: obj.name || null, id: obj.id || null };
    } catch {
      return null;
    }
  }
  if (trimmed.includes(' ')) {
    // Class string "fa-solid fa-user".
    return { id: trimmed, name: trimmed.split(' ').pop().replace(/^fa-/, '') };
  }
  // Bare name "user".
  return { name: trimmed.replace(/^fa-/, ''), id: null };
};

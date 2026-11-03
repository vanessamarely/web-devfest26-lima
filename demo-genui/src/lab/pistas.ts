// Tu propia pista en el panel Performance de DevTools (Extensibility API):
// performance.measure con detail.devtools aparece como "Nido · UI generativa" junto a todo lo demás.
export type Color = 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning';

export function pista(nombre: string, start: number, color: Color = 'tertiary', tooltipText?: string) {
  try {
    performance.measure(nombre, {
      start,
      end: performance.now(),
      detail: { devtools: { dataType: 'track-entry', track: 'Nido · UI generativa', color, tooltipText } },
    });
  } catch {
    /* navegadores sin measure con detail */
  }
}

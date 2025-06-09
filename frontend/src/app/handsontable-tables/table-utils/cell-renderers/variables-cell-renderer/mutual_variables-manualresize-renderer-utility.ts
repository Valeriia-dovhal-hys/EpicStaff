import Handsontable from 'handsontable';

export function mutual_Variables_RowResize_Renderer(
  instance: Handsontable.Core,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties,
  cache: Map<string, DocumentFragment>,
  pattern: RegExp
) {
  Handsontable.renderers.TextRenderer(
    instance,
    td,
    row,
    col,
    prop,
    '',
    cellProperties
  );

  td.style.position = 'relative';

  while (td.firstChild) {
    td.removeChild(td.firstChild);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'manual-row-resize-renderer';
  td.appendChild(wrapper);

  if (typeof value === 'string' && value.includes('{')) {
    if (cache.has(value)) {
      const cachedFragment = cache
        .get(value)!
        .cloneNode(true) as DocumentFragment;
      wrapper.appendChild(cachedFragment);
    } else {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(value)) !== null) {
        if (match.index > lastIndex) {
          const textNode = document.createTextNode(
            value.substring(lastIndex, match.index)
          );
          fragment.appendChild(textNode);
        }

        const variableSpan = document.createElement('span');
        variableSpan.className = 'highlight-variable-renderer';
        variableSpan.textContent = match[0];
        fragment.appendChild(variableSpan);

        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < value.length) {
        const textNode = document.createTextNode(value.substring(lastIndex));
        fragment.appendChild(textNode);
      }

      cache.set(value, fragment.cloneNode(true) as DocumentFragment);

      wrapper.appendChild(fragment);
    }
  } else {
    wrapper.textContent = value;
  }
}

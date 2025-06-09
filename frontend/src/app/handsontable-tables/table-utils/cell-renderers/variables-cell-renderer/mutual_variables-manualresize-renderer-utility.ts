// // custom-renderer.ts

// import Handsontable from 'handsontable';
// import { Renderer2 } from '@angular/core';

// export function mutual_Variables_RowResize_Renderer(
//   instance: Handsontable.Core,
//   td: HTMLTableCellElement,
//   row: number,
//   col: number,
//   prop: string | number,
//   value: any,
//   cellProperties: Handsontable.CellProperties,
//   renderer: Renderer2,
//   cache: Map<string, string>,
//   pattern: RegExp
// ) {
//   // Use the default TextRenderer as a base
//   Handsontable.renderers.TextRenderer(
//     instance,
//     td,
//     row,
//     col,
//     prop,
//     value,
//     cellProperties
//   );

//   // Ensure the cell is positioned relatively
//   renderer.setStyle(td, 'position', 'relative');

//   // Wrap the cell content in a div with class 'wrapper'
//   const cellContent = td.innerHTML;
//   td.innerHTML = `<div class="manual-row-resize-renderer">${cellContent}</div>`;

//   // Check if the value contains variables to highlight
//   if (typeof value === 'string' && value.includes('{')) {
//     // Check cache first to improve performance
//     if (cache.has(value)) {
//       // Update the innerHTML of the wrapper div with cached content
//       const wrapper = td.querySelector('.manual-row-resize-renderer');
//       if (wrapper) {
//         wrapper.innerHTML = cache.get(value)!;
//       }
//     } else {
//       // Replace variables with highlighted spans
//       const processedValue = value.replace(pattern, (match) => {
//         return `<span class="highlight-variable-renderer">${match}</span>`;
//       });

//       // Update cache with the processed value
//       cache.set(value, processedValue);

//       // Update the wrapper div's innerHTML with the processed content
//       const wrapper = td.querySelector('.manual-row-resize-renderer');
//       if (wrapper) {
//         wrapper.innerHTML = processedValue;
//       }
//     }
//   }
// }

// custom-renderer.ts

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
  // Use the default TextRenderer as a base
  Handsontable.renderers.TextRenderer(
    instance,
    td,
    row,
    col,
    prop,
    '',
    cellProperties
  );

  // Ensure the cell is positioned relatively
  td.style.position = 'relative';

  // Clear existing content
  while (td.firstChild) {
    td.removeChild(td.firstChild);
  }

  // Create a wrapper div
  const wrapper = document.createElement('div');
  wrapper.className = 'manual-row-resize-renderer';
  td.appendChild(wrapper);

  // Check if the value contains variables to highlight
  if (typeof value === 'string' && value.includes('{')) {
    // Check cache first to improve performance
    if (cache.has(value)) {
      // Clone the cached fragment and append
      const cachedFragment = cache
        .get(value)!
        .cloneNode(true) as DocumentFragment;
      wrapper.appendChild(cachedFragment);
    } else {
      // Process the value and create document fragment
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      pattern.lastIndex = 0; // Reset regex state

      let match;
      while ((match = pattern.exec(value)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
          const textNode = document.createTextNode(
            value.substring(lastIndex, match.index)
          );
          fragment.appendChild(textNode);
        }

        // Highlighted variable
        const variableSpan = document.createElement('span');
        variableSpan.className = 'highlight-variable-renderer';
        variableSpan.textContent = match[0];
        fragment.appendChild(variableSpan);

        lastIndex = pattern.lastIndex;
      }

      // Remaining text after last match
      if (lastIndex < value.length) {
        const textNode = document.createTextNode(value.substring(lastIndex));
        fragment.appendChild(textNode);
      }

      // Cache the fragment
      cache.set(value, fragment.cloneNode(true) as DocumentFragment);

      // Append the fragment to the wrapper
      wrapper.appendChild(fragment);
    }
  } else {
    // If no variables to highlight, just set the text content
    wrapper.textContent = value;
  }
}

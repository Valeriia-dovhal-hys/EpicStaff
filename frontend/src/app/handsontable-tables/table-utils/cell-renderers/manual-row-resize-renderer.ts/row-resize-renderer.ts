import Handsontable from 'handsontable';

//Makes Row Resizeable.
//MUST BE USED WITH THIS CSS:
// .manual-row-resize-renderer {
//     position: absolute;
//     overflow: hidden;
//     word-break: break-word;
//     height: 100%;
//     padding: 5px;
//     box-sizing: border-box;
//     color: #db0000; /* Set your desired text color */
//     font-family: Arial, sans-serif; /* Set your desired font family */
//     line-height: 1.4;
//   }

// export function manualRowResizeRenderer(
//   this: any,
//   instance: Handsontable.Core,
//   td: HTMLTableCellElement,
//   row: number,
//   col: number,
//   prop: string | number,
//   value: any,
//   cellProperties: Handsontable.CellProperties
// ): void {
//   // Call the default text renderer
//   Handsontable.renderers.TextRenderer.apply(this, arguments as any);

//   // Ensure the cell is positioned relatively
//   td.style.position = 'relative';

//   // Get the current cell content
//   const cellContent = td.innerHTML;

//   // Wrap the cell content in a div with class 'wrapper'
//   td.innerHTML = `<div class="manual-row-resize-renderer">${cellContent}</div>`;
// }

export function manualRowResizeRenderer(
  this: any,
  instance: Handsontable.Core,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Handsontable.CellProperties
): void {
  // Call the default text renderer
  Handsontable.renderers.TextRenderer.apply(this, arguments as any);

  // Ensure the cell is positioned relatively
  td.style.position = 'relative';

  // Clear the existing content
  while (td.firstChild) {
    td.removeChild(td.firstChild);
  }

  // Create a div with the desired class
  const wrapper = document.createElement('div');
  wrapper.className = 'manual-row-resize-renderer';

  // Create a text node with the cell content
  const textNode = document.createTextNode(
    value != null ? value.toString() : ''
  );

  // Append the text node to the wrapper
  wrapper.appendChild(textNode);

  // Append the wrapper to the cell
  td.appendChild(wrapper);
}

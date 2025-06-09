import { textRenderer } from 'handsontable/renderers/textRenderer';

//Makes Row Resizeable.
//SHOULD BE USED WITH THIS CSS:
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

export function manualRowResizeRenderer(
  this: any,
  instance: any,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: any
): void {
  // Call the default text renderer
  textRenderer.apply(this, arguments as any);

  // Ensure the cell is positioned relatively
  td.style.position = 'relative';

  // Clear the existing content using native DOM methods
  while (td.firstChild) {
    td.removeChild(td.firstChild);
  }

  // Create a div with the desired class
  const wrapper: HTMLDivElement = document.createElement('div');
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

// custom-status-renderer.ts

import Handsontable from 'handsontable/base';
import { LLM_Model } from '../../../../shared/models/LLM.model';
import { LLM_Provider } from '../../../../shared/models/LLM_provider.model';

export function createCustomStatusRenderer(
  providers: LLM_Provider[],
  llmModels: LLM_Model[],
  eventListenerRefs: Array<() => void>
) {
  return function customStatusRenderer(
    instance: Handsontable.Core,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: any,
    value: any,
    cellProperties: any
  ): void {
    // Remove existing event listeners if any
    if (cellProperties.iconClickListener && cellProperties.iconElement) {
      cellProperties.iconElement.removeEventListener(
        'click',
        cellProperties.iconClickListener
      );
    }
    if (cellProperties.documentClickListener) {
      document.removeEventListener(
        'mousedown',
        cellProperties.documentClickListener
      );
    }
    if (cellProperties.popupElement) {
      cellProperties.popupElement.remove();
    }

    // Clear the cell content
    Handsontable.dom.empty(td);

    // Set up the cell
    td.style.position = 'relative';
    td.style.overflow = 'visible'; // Ensure popup is visible
    td.style.padding = '0';
    td.style.margin = '0';
    td.style.boxSizing = 'border-box';

    // Create a wrapper that fills the cell height and width
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%'; // Ensure the wrapper fills the cell width
    wrapper.style.justifyContent = 'flex-end'; // Align content to the bottom

    // Create a container for the value and icon
    const container = document.createElement('div');
    container.classList.add('status-cell-container');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'space-between';
    container.style.width = '100%';
    container.style.boxSizing = 'border-box'; // Include padding and borders in width
    container.style.marginBottom = '5px'; // Adjust this value as needed

    // Create the LLM value display element
    const valueElement = document.createElement('span');
    valueElement.classList.add('llm-value');
    valueElement.textContent = value || ''; // Display the current cell value
    valueElement.style.flexGrow = '1';
    valueElement.style.marginRight = '5px';
    valueElement.style.overflow = 'hidden';
    valueElement.style.textOverflow = 'ellipsis';
    valueElement.style.whiteSpace = 'nowrap';

    // Create the icon/button element
    const iconElement = document.createElement('span');
    iconElement.classList.add('status-icon');
    iconElement.style.cursor = 'pointer'; // Change cursor on hover
    iconElement.style.display = 'flex';
    iconElement.style.alignItems = 'center';
    iconElement.style.justifyContent = 'center';
    iconElement.style.padding = '0 5px';

    // Create an SVG icon
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svgElement = document.createElementNS(svgNamespace, 'svg');
    svgElement.setAttribute('viewBox', '0 0 24 24');
    svgElement.setAttribute('width', '16'); // Adjust size as needed
    svgElement.setAttribute('height', '16');
    svgElement.setAttribute('fill', 'currentColor');

    // Create a path element for the SVG
    const pathElement = document.createElementNS(svgNamespace, 'path');
    pathElement.setAttribute('d', 'M7 10l5 5 5-5H7z'); // Path data for a modern down arrow

    // Append the path to the SVG
    svgElement.appendChild(pathElement);

    // Append the SVG to the icon element
    iconElement.appendChild(svgElement);

    // Append the value and icon to the container
    container.appendChild(valueElement);
    container.appendChild(iconElement);

    // Append the container to the wrapper
    wrapper.appendChild(container);

    // Append the wrapper to the cell
    td.appendChild(wrapper);

    // Create the popup element
    const popupElement = document.createElement('div');
    popupElement.classList.add('status-popup');
    popupElement.style.display = 'none';
    popupElement.style.position = 'absolute';
    popupElement.style.zIndex = '1000'; // Ensure it appears above other elements
    popupElement.style.background = '#fff';
    popupElement.style.border = '1px solid #ccc';
    popupElement.style.padding = '10px';
    popupElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    // Position the popup below the container by default
    popupElement.style.top = '100%';
    popupElement.style.left = '0';

    // Set overflow to auto
    popupElement.style.overflow = 'auto';
    popupElement.style.maxHeight = '300px'; // Adjust as needed

    // Append the popup to the cell
    td.appendChild(popupElement);

    // Function to populate the provider select and LLM list
    function populatePopup() {
      // Clear existing content
      popupElement.innerHTML = '';

      // Create a select element for providers
      const providerSelect = document.createElement('select');
      providerSelect.classList.add('provider-select');
      providerSelect.style.width = '100%';
      providerSelect.style.marginBottom = '10px';

      // Add a default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select Provider';
      providerSelect.appendChild(defaultOption);

      // Populate providers in the select
      providers.forEach((provider) => {
        const option = document.createElement('option');
        option.value = provider.id.toString();
        option.textContent = provider.name;
        providerSelect.appendChild(option);
      });

      // Create a container for LLMs
      const llmListContainer = document.createElement('div');
      llmListContainer.classList.add('llm-list-container');
      llmListContainer.style.maxHeight = '200px'; // Adjust as needed
      llmListContainer.style.overflowY = 'auto'; // Enable vertical scrolling
      llmListContainer.style.borderTop = '1px solid #ccc';
      llmListContainer.style.paddingTop = '10px';

      // Event listener for provider selection change
      providerSelect.addEventListener('change', () => {
        const selectedProviderId = parseInt(providerSelect.value, 10);
        // Clear LLM list
        llmListContainer.innerHTML = '';

        if (!isNaN(selectedProviderId)) {
          // Get LLMs for selected provider
          const llmsForProvider = llmModels.filter(
            (llm) => llm.llm_provider === selectedProviderId
          );

          // Populate LLMs
          llmsForProvider.forEach((llm) => {
            const llmElement = document.createElement('div');
            llmElement.classList.add('llm-item');
            llmElement.textContent = llm.name;
            llmElement.style.cursor = 'pointer';
            llmElement.style.padding = '5px 0';

            // Highlight if this LLM is selected
            if (llm.name === value) {
              llmElement.style.backgroundColor = '#d3d3d3'; // Adjust color as needed
              llmElement.style.fontWeight = 'bold';
            }

            llmElement.addEventListener('click', () => {
              // Update the cell value
              instance.setDataAtCell(row, col, llm.name, 'StatusRenderer');
              // Update the displayed value
              valueElement.textContent = llm.name;
              // Close the popup
              popupElement.style.display = 'none';
              // Remove document click listener
              document.removeEventListener(
                'mousedown',
                cellProperties.documentClickListener
              );
            });
            llmListContainer.appendChild(llmElement);
          });

          if (llmsForProvider.length === 0) {
            const noLlmsMessage = document.createElement('div');
            noLlmsMessage.textContent = 'No LLMs available for this provider.';
            noLlmsMessage.style.color = '#888';
            llmListContainer.appendChild(noLlmsMessage);
          }
        }
      });

      // Append elements to popup
      popupElement.appendChild(providerSelect);
      popupElement.appendChild(llmListContainer);
    }

    // Event listener for icon click
    const iconClickListener = (event: Event) => {
      event.stopPropagation();
      if (
        popupElement.style.display === 'none' ||
        popupElement.style.display === ''
      ) {
        // Show the popup
        populatePopup();

        // Initially hide the popup to measure its height
        popupElement.style.display = 'block';
        popupElement.style.visibility = 'hidden'; // Hide it visually but keep it in layout

        // Measure the popup's height
        const popupRect = popupElement.getBoundingClientRect();
        const popupHeight = popupRect.height;

        // Get the bounding rectangle of the icon
        const iconRect = iconElement.getBoundingClientRect();

        // Calculate available space below and above the icon
        const spaceBelow = window.innerHeight - iconRect.bottom;
        const spaceAbove = iconRect.top;

        // Decide whether to display popup below or above
        if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
          // Display below
          popupElement.style.top = '100%';
          popupElement.style.bottom = 'auto';
        } else {
          // Display above
          popupElement.style.bottom = '100%';
          popupElement.style.top = 'auto';
        }

        // Now make the popup visible
        popupElement.style.visibility = 'visible';

        // Add a document click listener to close the popup when clicking outside
        const documentClickListener = (docEvent: MouseEvent) => {
          if (
            !popupElement.contains(docEvent.target as Node) &&
            !iconElement.contains(docEvent.target as Node)
          ) {
            popupElement.style.display = 'none';
            document.removeEventListener(
              'mousedown',
              cellProperties.documentClickListener
            );
          }
        };
        document.addEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = documentClickListener;
      } else {
        // Hide the popup
        popupElement.style.display = 'none';
        if (cellProperties.documentClickListener) {
          document.removeEventListener(
            'mousedown',
            cellProperties.documentClickListener
          );
        }
      }
    };

    // Attach the event listener to the icon
    iconElement.addEventListener('click', iconClickListener);

    // Store references for cleanup
    cellProperties.iconElement = iconElement;
    cellProperties.iconClickListener = iconClickListener;
    cellProperties.popupElement = popupElement;

    // Cleanup function
    eventListenerRefs.push(() => {
      if (cellProperties.iconClickListener && cellProperties.iconElement) {
        cellProperties.iconElement.removeEventListener(
          'click',
          cellProperties.iconClickListener
        );
      }
      if (cellProperties.documentClickListener) {
        document.removeEventListener(
          'mousedown',
          cellProperties.documentClickListener
        );
      }
      if (cellProperties.popupElement) {
        cellProperties.popupElement.remove();
      }
      // Clear stored references
      cellProperties.iconClickListener = null;
      cellProperties.documentClickListener = null;
      cellProperties.iconElement = null;
      cellProperties.popupElement = null;
    });
  };
}

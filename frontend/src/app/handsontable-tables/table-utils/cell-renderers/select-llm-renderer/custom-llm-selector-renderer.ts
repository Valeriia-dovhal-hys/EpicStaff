// custom-agent-llm-select-renderer.ts

import Handsontable from 'handsontable';
import { LLM_Model } from '../../../../shared/models/LLM.model';

export function createCustomAgentLlmSelectRenderer(
  llmModels: LLM_Model[],
  eventListenerRefs: Array<() => void>
) {
  return function customAgentLlmSelectRenderer(
    instance: Handsontable.Core,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: any,
    value: any,
    cellProperties: any
  ): void {
    // **Remove existing event listeners if any**
    if (
      cellProperties.selectedValueClickListener &&
      cellProperties.selectedValueDiv
    ) {
      cellProperties.selectedValueDiv.removeEventListener(
        'click',
        cellProperties.selectedValueClickListener
      );
    }
    if (cellProperties.documentClickListener) {
      document.removeEventListener(
        'mousedown',
        cellProperties.documentClickListener
      );
    }
    if (cellProperties.optionsListClickListener && cellProperties.optionsList) {
      cellProperties.optionsList.removeEventListener(
        'click',
        cellProperties.optionsListClickListener
      );
    }

    // **Clear the cell content**
    Handsontable.dom.empty(td);

    // **Set up the cell for the dropdown**
    td.style.position = 'relative';
    td.style.overflow = 'visible';

    // **Create the main container for the custom dropdown**
    const container = document.createElement('div');
    container.classList.add('custom-dropdown-container');

    // **Create the element that displays the selected value**
    const selectedValueDiv = document.createElement('div');
    selectedValueDiv.classList.add('selected-value');

    // **Create a span to display the selected text**
    const selectedTextSpan = document.createElement('span');
    selectedTextSpan.classList.add('selected-text');
    selectedTextSpan.textContent = value || '';

    // **Create an icon for the dropdown arrow**
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('dropdown-icon');
    iconSpan.textContent = '▼';

    // **Assemble the selected value display**
    selectedValueDiv.appendChild(selectedTextSpan);
    selectedValueDiv.appendChild(iconSpan);

    // **Create the container for the dropdown options**
    const optionsList = document.createElement('div');
    optionsList.classList.add('options-list');
    optionsList.style.display = 'none';

    // **Populate the options list using llmModels**
    llmModels.forEach((model) => {
      const optionDiv = document.createElement('div');
      optionDiv.classList.add('option-item');
      optionDiv.textContent = model.name;
      optionDiv.dataset['modelId'] = model.id.toString(); // Store the ID

      // Highlight if this option is the currently selected value
      if (model.name === value) {
        optionDiv.classList.add('selected');
      }

      optionsList.appendChild(optionDiv);
    });

    // **Assemble the main container**
    container.appendChild(selectedValueDiv);
    container.appendChild(optionsList);
    td.appendChild(container);

    // **Store elements in cellProperties for future reference**
    cellProperties.selectedValueDiv = selectedValueDiv;
    cellProperties.optionsList = optionsList;

    // **Event listener for clicks outside the dropdown (closes the dropdown)**
    const documentClickListener = (event: MouseEvent) => {
      if (
        !container.contains(event.target as Node) &&
        optionsList.style.display === 'block'
      ) {
        optionsList.style.display = 'none';

        // Remove event listeners and clear references
        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        // **Remove the 'open' class and reset the arrow**
        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';
      }
    };

    // **Event listener for selecting an option from the dropdown**
    const handleOptionClick = (event: Event) => {
      const target = event.target as HTMLElement;

      if (target && target.classList.contains('option-item')) {
        event.stopPropagation();

        const selectedModelName = target.textContent || '';

        // Update the selected value display
        selectedTextSpan.textContent = selectedModelName;

        // Close the dropdown
        optionsList.style.display = 'none';

        // Remove event listeners and clear references
        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        // Remove the 'open' class and reset the arrow
        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';

        instance.setDataAtCell(row, col, selectedModelName, 'LMM_Dropdown');
      }
    };

    const handleSelectedValueClick = (event: Event) => {
      event.stopPropagation();

      const isVisible: boolean = optionsList.style.display === 'block';

      if (isVisible) {
        // Close the dropdown
        optionsList.style.display = 'none';

        // Remove event listeners and clear references
        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        // **Remove the 'open' class and reset the arrow**
        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';
      } else {
        optionsList.style.left = '';
        optionsList.style.right = '';
        optionsList.style.transform = '';
        optionsList.style.visibility = 'hidden';
        optionsList.style.display = 'block';

        const selectRect = selectedValueDiv.getBoundingClientRect();
        const optionsRect = optionsList.getBoundingClientRect();

        optionsList.style.display = 'none';
        optionsList.style.visibility = 'visible';

        let positionAdjusted: boolean = false;

        if (selectRect.left + optionsRect.width > window.innerWidth) {
          optionsList.style.left = 'auto';
          optionsList.style.right = '0';
          positionAdjusted = true;
        }

        if (positionAdjusted && optionsList.getBoundingClientRect().left < 0) {
          optionsList.style.left = '0';
          optionsList.style.right = 'auto';
        }

        // **Determine dropdown open direction (up or down)**
        const spaceBelow = window.innerHeight - selectRect.bottom;
        const spaceAbove = selectRect.top;

        let openDirection: 'up' | 'down' = 'down';

        // Decide whether to open upwards or downwards based on available space
        const dropdownHeight = optionsList.offsetHeight || 200; // Use fixed height or default to 200

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          openDirection = 'up';
        }

        // **Position the dropdown vertically**
        if (openDirection === 'up') {
          optionsList.style.bottom = '100%';
          optionsList.style.top = 'auto';
          iconSpan.textContent = '▲'; // Arrow pointing up
        } else {
          optionsList.style.top = '100%';
          optionsList.style.bottom = 'auto';
          iconSpan.textContent = '▼'; // Arrow pointing down
        }

        // **Remove any inline maxHeight to let CSS handle it**
        optionsList.style.maxHeight = '';

        // Open the dropdown
        optionsList.style.display = 'block';

        // Attach event listeners and store references
        document.addEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = documentClickListener;

        // **Add the 'open' class**
        selectedValueDiv.classList.add('open');
      }
    };

    // **Attach the event listener to the selected value display**
    selectedValueDiv.addEventListener('click', handleSelectedValueClick);
    cellProperties.selectedValueClickListener = handleSelectedValueClick;

    // **Attach the event listener to the options list**
    optionsList.addEventListener('click', handleOptionClick);
    cellProperties.optionsListClickListener = handleOptionClick;

    // **Store a cleanup function in eventListenerRefs**
    eventListenerRefs.push(() => {
      // Remove event listeners
      if (
        cellProperties.selectedValueClickListener &&
        cellProperties.selectedValueDiv
      ) {
        cellProperties.selectedValueDiv.removeEventListener(
          'click',
          cellProperties.selectedValueClickListener
        );
      }

      if (
        cellProperties.optionsListClickListener &&
        cellProperties.optionsList
      ) {
        cellProperties.optionsList.removeEventListener(
          'click',
          cellProperties.optionsListClickListener
        );
      }

      if (cellProperties.documentClickListener) {
        document.removeEventListener(
          'mousedown',
          cellProperties.documentClickListener
        );
      }

      // Clear stored references
      cellProperties.selectedValueClickListener = null;
      cellProperties.optionsListClickListener = null;
      cellProperties.documentClickListener = null;
      cellProperties.selectedValueDiv = null;
      cellProperties.optionsList = null;
    });
  };
}

import Handsontable from 'handsontable/base';
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
    // Clean up previous event listeners
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

    // Clear the cell
    Handsontable.dom.empty(td);

    // Ensure the cell is positioned relatively
    td.style.position = 'relative';
    td.style.overflow = 'visible';

    // Create the container for the dropdown
    const container = document.createElement('div');
    container.classList.add('custom-dropdown-container');

    // Create the selected value display
    const selectedValueDiv = document.createElement('div');
    selectedValueDiv.classList.add('selected-value');

    const selectedTextSpan = document.createElement('span');
    selectedTextSpan.classList.add('selected-text');
    selectedTextSpan.textContent = value || '';

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('dropdown-icon');
    iconSpan.textContent = '▼';

    selectedValueDiv.appendChild(selectedTextSpan);
    selectedValueDiv.appendChild(iconSpan);

    // Create the options list
    const optionsList = document.createElement('div');
    optionsList.classList.add('options-list');
    optionsList.style.display = 'none';

    llmModels.forEach((model) => {
      const optionDiv = document.createElement('div');
      optionDiv.classList.add('option-item');
      optionDiv.textContent = model.name;
      optionDiv.dataset['modelId'] = model.id.toString();

      if (model.name === value) {
        optionDiv.classList.add('selected');
      }

      optionsList.appendChild(optionDiv);
    });

    container.appendChild(selectedValueDiv);
    td.appendChild(container);
    td.appendChild(optionsList);

    // Store references in cellProperties for cleanup
    cellProperties.selectedValueDiv = selectedValueDiv;
    cellProperties.optionsList = optionsList;

    // Document click listener to close the dropdown
    const documentClickListener = (event: MouseEvent) => {
      if (
        !td.contains(event.target as Node) &&
        optionsList.style.display === 'block'
      ) {
        optionsList.style.display = 'none';

        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';
      }
    };

    // Handle option selection
    const handleOptionClick = (event: Event) => {
      const target = event.target as HTMLElement;

      if (target && target.classList.contains('option-item')) {
        event.stopPropagation();

        const selectedModelName = target.textContent || '';

        selectedTextSpan.textContent = selectedModelName;

        optionsList.style.display = 'none';

        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';

        instance.setDataAtCell(row, col, selectedModelName, 'LMM_Dropdown');
      }
    };

    // Handle click on the selected value to toggle dropdown
    const handleSelectedValueClick = (event: Event) => {
      event.stopPropagation();

      const isVisible: boolean = optionsList.style.display === 'block';

      if (isVisible) {
        optionsList.style.display = 'none';

        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';
      } else {
        // Reset styles
        optionsList.style.left = '';
        optionsList.style.right = '';
        optionsList.style.transform = '';
        optionsList.style.visibility = 'hidden';
        optionsList.style.display = 'block';

        const tdRect = td.getBoundingClientRect();

        // Adjust width to be at least as wide as the cell
        optionsList.style.width = ''; // Reset width
        const optionsRect = optionsList.getBoundingClientRect();

        if (optionsRect.width < tdRect.width) {
          optionsList.style.width = `${tdRect.width}px`;
        }

        // Now that width may have changed, get the optionsList height again
        const optionsRectUpdated = optionsList.getBoundingClientRect();

        // Calculate space below and above
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - tdRect.bottom;
        const spaceAbove = tdRect.top;

        let dropdownTopPosition = 0;

        // Decide whether to open dropdown above or below
        if (
          spaceBelow >= optionsRectUpdated.height ||
          spaceBelow >= spaceAbove
        ) {
          // Position the dropdown below the cell
          dropdownTopPosition = td.offsetHeight;
          optionsList.style.top = `${dropdownTopPosition}px`;
        } else {
          // Position the dropdown above the cell
          dropdownTopPosition = -optionsRectUpdated.height;
          optionsList.style.top = `${dropdownTopPosition}px`;
        }

        optionsList.style.left = '0';

        // Handle overflow on the right edge
        const optionsRectAfter = optionsList.getBoundingClientRect();
        if (optionsRectAfter.right > window.innerWidth) {
          optionsList.style.left = `${
            window.innerWidth - optionsRectAfter.right
          }px`;
        }

        optionsList.style.display = 'block';
        optionsList.style.visibility = 'visible';

        document.addEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = documentClickListener;

        selectedValueDiv.classList.add('open');
        iconSpan.textContent = '▲';
      }
    };

    // Attach event listeners
    selectedValueDiv.addEventListener('click', handleSelectedValueClick);
    cellProperties.selectedValueClickListener = handleSelectedValueClick;

    optionsList.addEventListener('click', handleOptionClick);
    cellProperties.optionsListClickListener = handleOptionClick;

    // Store cleanup references
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

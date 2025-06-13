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

    Handsontable.dom.empty(td);

    td.style.position = 'relative';
    td.style.overflow = 'visible';

    const container = document.createElement('div');
    container.classList.add('custom-dropdown-container');

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
    container.appendChild(optionsList);
    td.appendChild(container);

    cellProperties.selectedValueDiv = selectedValueDiv;
    cellProperties.optionsList = optionsList;

    const documentClickListener = (event: MouseEvent) => {
      if (
        !container.contains(event.target as Node) &&
        optionsList.style.display === 'block'
      ) {
        optionsList.style.display = 'none';

        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';
      }
    };

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

        const spaceBelow = window.innerHeight - selectRect.bottom;
        const spaceAbove = selectRect.top;

        let openDirection: 'up' | 'down' = 'down';

        const dropdownHeight = optionsList.offsetHeight || 200; // Use fixed height or default to 200

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          openDirection = 'up';
        }

        // **Position the dropdown vertically**
        if (openDirection === 'up') {
          optionsList.style.bottom = '100%';
          optionsList.style.top = 'auto';
          iconSpan.textContent = '▲';
        } else {
          optionsList.style.top = '100%';
          optionsList.style.bottom = 'auto';
          iconSpan.textContent = '▼';
        }

        optionsList.style.maxHeight = '';

        optionsList.style.display = 'block';

        document.addEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = documentClickListener;

        selectedValueDiv.classList.add('open');
      }
    };

    selectedValueDiv.addEventListener('click', handleSelectedValueClick);
    cellProperties.selectedValueClickListener = handleSelectedValueClick;

    optionsList.addEventListener('click', handleOptionClick);
    cellProperties.optionsListClickListener = handleOptionClick;

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

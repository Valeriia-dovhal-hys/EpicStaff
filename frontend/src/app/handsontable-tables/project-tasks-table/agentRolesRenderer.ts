// assigned-agent-role-renderer.ts

import Handsontable from 'handsontable/base';

export function createAssignedAgentRoleRenderer(
  agentRoles: string[],
  eventListenerRefs: Array<() => void>
) {
  return function assignedAgentRoleRenderer(
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
    // Set the selected text
    selectedTextSpan.textContent = value || 'Not Assigned';

    // **Create an icon for the dropdown arrow**
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('dropdown-icon');
    iconSpan.textContent = '▼'; // Default arrow pointing down

    // **Assemble the selected value display**
    selectedValueDiv.appendChild(selectedTextSpan);
    selectedValueDiv.appendChild(iconSpan);

    // **Create the container for the dropdown options**
    const optionsList = document.createElement('div');
    optionsList.classList.add('options-list');
    optionsList.style.display = 'none';

    // **Populate the options list**
    agentRoles.forEach((role) => {
      const optionDiv = document.createElement('div');
      optionDiv.classList.add('option-item');
      optionDiv.textContent = role;

      // Highlight if this option is the currently selected value
      if (role === value) {
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

        const selectedRole = target.textContent || '';

        selectedTextSpan.textContent = selectedRole;

        optionsList.style.display = 'none';

        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';

        instance.setDataAtCell(row, col, selectedRole, 'customDropdown');
      }
    };

    const handleSelectedValueClick = (event: Event) => {
      event.stopPropagation();

      const isVisible = optionsList.style.display === 'block';

      if (isVisible) {
        optionsList.style.display = 'none';

        document.removeEventListener('mousedown', documentClickListener);
        cellProperties.documentClickListener = null;

        selectedValueDiv.classList.remove('open');
        iconSpan.textContent = '▼';
      } else {
        optionsList.style.visibility = 'hidden';
        optionsList.style.display = 'block';

        const requiredHeight = optionsList.scrollHeight;

        optionsList.style.display = 'none';
        optionsList.style.visibility = 'visible';

        const extraSpace = 30;

        const selectRect = selectedValueDiv.getBoundingClientRect();

        const spaceBelow = window.innerHeight - selectRect.bottom;
        const spaceAbove = selectRect.top;

        let openDirection: 'up' | 'down';
        let availableHeight: number;

        if (spaceBelow >= requiredHeight + extraSpace) {
          openDirection = 'down';
          availableHeight = requiredHeight;
        } else if (spaceAbove >= requiredHeight + extraSpace) {
          openDirection = 'up';
          availableHeight = requiredHeight;
        } else {
          if (spaceBelow >= spaceAbove) {
            openDirection = 'down';
            availableHeight = spaceBelow - extraSpace;
          } else {
            openDirection = 'up';
            availableHeight = spaceAbove - extraSpace;
          }

          availableHeight = Math.min(availableHeight, requiredHeight);

          availableHeight = Math.max(availableHeight, 50);
        }

        if (openDirection === 'up') {
          optionsList.style.bottom = '100%';
          optionsList.style.top = 'auto';
          iconSpan.textContent = '▲';
        } else {
          optionsList.style.top = '100%';
          optionsList.style.bottom = 'auto';
          iconSpan.textContent = '▼';
        }

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

      cellProperties.selectedValueClickListener = null;
      cellProperties.optionsListClickListener = null;
      cellProperties.documentClickListener = null;
      cellProperties.selectedValueDiv = null;
      cellProperties.optionsList = null;
    });
  };
}

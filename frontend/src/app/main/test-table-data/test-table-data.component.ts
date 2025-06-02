import { Component } from '@angular/core';
import Handsontable from 'handsontable';
import { HotTableModule } from '@handsontable/angular';

@Component({
  selector: 'app-test-table-data',
  standalone: true,
  imports: [HotTableModule],
  templateUrl: './test-table-data.component.html',
  styleUrls: ['./test-table-data.component.scss'],
})
export class TestTableDataComponent {
  // Sample data initialization
  tableData = [
    { id: 1, name: 'John Doe', age: 25, email: 'john.doe@example.com' },
    { id: 2, name: 'Jane Smith', age: 30, email: 'jane.smith@example.com' },
    {
      id: 3,
      name: 'Alice Johnson',
      age: 27,
      email: 'alice.johnson@example.com',
    },
  ];

  // Define column headers
  tableColumns = [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'age', title: 'Age' },
    { data: 'email', title: 'Email' },
  ];

  // Function to handle cell changes
  handleAfterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (changes && source !== 'loadData') {
      console.log('ALL cell changes:', changes);
      changes.forEach((change) => {
        const [row, prop, oldValue, newValue] = change;
        console.log(
          `Row: ${row}, Column: ${prop}, Old Value: ${oldValue}, New Value: ${newValue}`
        );
      });
      console.log('Updated table data:', this.tableData);
    }
  };

  // Function to handle row deletions
  handleAfterRemoveRow = (
    index: number,
    amount: number,
    removedRows: any[]
  ) => {
    console.log(`Removed ${amount} row(s) starting from index ${index}.`);
    console.log('Removed row data:', removedRows);
    console.log('Updated table data after row removal:', this.tableData);
  };

  // Handsontable settings
  hotSettings: Handsontable.GridSettings = {
    colHeaders: true,
    columns: this.tableColumns,
    stretchH: 'all',
    rowHeaders: true,
    width: '100%',
    height: 'auto',
    afterChange: this.handleAfterChange, // Hook the change handler here
    afterRemoveRow: this.handleAfterRemoveRow, // Hook the row removal handler here
    contextMenu: true, // Enable context menu
    licenseKey: 'non-commercial-and-evaluation', // Use this key for non-commercial purposes
  };
}

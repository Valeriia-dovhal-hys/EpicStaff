import {
  base_default
} from "./chunk-3ZQHOYXO.js";
import {
  Component,
  Injectable,
  Input,
  NgModule,
  NgZone,
  ViewChild,
  ViewEncapsulation$1,
  setClassMetadata,
  ɵɵNgOnChangesFeature,
  ɵɵProvidersFeature,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵloadQuery,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵviewQuery
} from "./chunk-YIRM2NHN.js";
import "./chunk-QN5HDKTT.js";
import "./chunk-XPU7EA6D.js";
import "./chunk-MHK6ZZQX.js";
import "./chunk-N6ESDQJH.js";

// node_modules/@handsontable/angular/fesm2022/handsontable-angular.mjs
var _c0 = ["container"];
var instances = /* @__PURE__ */ new Map();
var HOT_DESTROYED_WARNING = "The Handsontable instance bound to this component was destroyed and cannot be used properly.";
var HotTableRegisterer = class _HotTableRegisterer {
  getInstance(id) {
    const hotInstance = instances.get(id);
    if (hotInstance.isDestroyed) {
      console.warn(HOT_DESTROYED_WARNING);
      return null;
    }
    return hotInstance;
  }
  registerInstance(id, instance) {
    return instances.set(id, instance);
  }
  removeInstance(id) {
    return instances.delete(id);
  }
  static ɵfac = function HotTableRegisterer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HotTableRegisterer)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HotTableRegisterer,
    factory: _HotTableRegisterer.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HotTableRegisterer, [{
    type: Injectable
  }], null, null);
})();
var AVAILABLE_OPTIONS = Object.keys(base_default.DefaultSettings);
var AVAILABLE_HOOKS = base_default.hooks.getRegistered();
var HotSettingsResolver = class _HotSettingsResolver {
  mergeSettings(component) {
    const isSettingsObject = "settings" in component && typeof component["settings"] === "object";
    const mergedSettings = isSettingsObject ? component["settings"] : {};
    const options = AVAILABLE_HOOKS.concat(AVAILABLE_OPTIONS);
    options.forEach((key) => {
      const isHook = AVAILABLE_HOOKS.indexOf(key) > -1;
      let option;
      if (isSettingsObject && isHook) {
        option = component["settings"][key];
      }
      if (component[key] !== void 0) {
        option = component[key];
      }
      if (option === void 0) {
        return;
      } else if ("ngZone" in component && typeof option === "function" && isHook) {
        mergedSettings[key] = function(...args) {
          return component.ngZone.run(() => option.apply(this, args));
        };
      } else {
        mergedSettings[key] = option;
      }
    });
    return mergedSettings;
  }
  prepareChanges(changes) {
    const result = {};
    const parameters = Object.keys(changes);
    parameters.forEach((param) => {
      if (changes.hasOwnProperty(param)) {
        result[param] = changes[param].currentValue;
      }
    });
    return result;
  }
  static ɵfac = function HotSettingsResolver_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HotSettingsResolver)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _HotSettingsResolver,
    factory: _HotSettingsResolver.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HotSettingsResolver, [{
    type: Injectable
  }], null, null);
})();
var HotTableComponent = class _HotTableComponent {
  _hotTableRegisterer;
  _hotSettingsResolver;
  ngZone;
  container;
  __hotInstance = null;
  columnsComponents = [];
  // component inputs
  settings;
  hotId = "";
  // handsontable options
  activeHeaderClassName;
  allowEmpty;
  allowHtml;
  allowInsertColumn;
  allowInsertRow;
  allowInvalid;
  allowRemoveColumn;
  allowRemoveRow;
  ariaTags;
  autoColumnSize;
  autoRowSize;
  autoWrapCol;
  autoWrapRow;
  bindRowsWithHeaders;
  cell;
  cells;
  checkedTemplate;
  className;
  colHeaders;
  collapsibleColumns;
  columnHeaderHeight;
  columns;
  columnSorting;
  columnSummary;
  colWidths;
  commentedCellClassName;
  comments;
  contextMenu;
  copyable;
  copyPaste;
  correctFormat;
  currentColClassName;
  currentHeaderClassName;
  currentRowClassName;
  customBorders;
  data;
  dataDotNotation;
  dataSchema;
  dateFormat;
  datePickerConfig;
  defaultDate;
  tabNavigation;
  disableVisualSelection;
  dragToScroll;
  dropdownMenu;
  editor;
  enterBeginsEditing;
  enterMoves;
  fillHandle;
  filter;
  filteringCaseSensitive;
  filters;
  fixedColumnsLeft;
  fixedColumnsStart;
  fixedRowsBottom;
  fixedRowsTop;
  formulas;
  fragmentSelection;
  headerClassName;
  height;
  hiddenColumns;
  hiddenRows;
  invalidCellClassName;
  imeFastEdit;
  label;
  language;
  layoutDirection;
  licenseKey;
  locale;
  manualColumnFreeze;
  manualColumnMove;
  manualColumnResize;
  manualRowMove;
  manualRowResize;
  maxCols;
  maxRows;
  mergeCells;
  minCols;
  minRows;
  minSpareCols;
  minSpareRows;
  multiColumnSorting;
  navigableHeaders;
  nestedHeaders;
  nestedRows;
  noWordWrapClassName;
  numericFormat;
  observeDOMVisibility;
  outsideClickDeselects;
  persistentState;
  placeholder;
  placeholderCellClassName;
  preventOverflow;
  preventWheel;
  readOnly;
  readOnlyCellClassName;
  renderAllColumns;
  renderAllRows;
  renderer;
  rowHeaders;
  rowHeaderWidth;
  rowHeights;
  search;
  selectionMode;
  selectOptions;
  skipColumnOnPaste;
  skipRowOnPaste;
  sortByRelevance;
  source;
  startCols;
  startRows;
  stretchH;
  strict;
  tableClassName;
  tabMoves;
  title;
  trimDropdown;
  trimRows;
  trimWhitespace;
  type;
  uncheckedTemplate;
  undo;
  validator;
  viewportColumnRenderingOffset;
  viewportRowRenderingOffset;
  visibleRows;
  width;
  wordWrap;
  // handsontable hooks
  afterAddChild;
  afterAutofill;
  afterBeginEditing;
  afterCellMetaReset;
  afterChange;
  afterChangesObserved;
  afterColumnCollapse;
  afterColumnExpand;
  afterColumnFreeze;
  afterColumnMove;
  afterColumnResize;
  afterColumnSequenceChange;
  afterColumnSort;
  afterColumnUnfreeze;
  afterContextMenuDefaultOptions;
  afterContextMenuHide;
  afterContextMenuShow;
  afterCopy;
  afterCopyLimit;
  afterCreateCol;
  afterCreateRow;
  afterCut;
  afterDeselect;
  afterDestroy;
  afterDetachChild;
  afterDocumentKeyDown;
  afterDrawSelection;
  afterDropdownMenuDefaultOptions;
  afterDropdownMenuHide;
  afterDropdownMenuShow;
  afterFilter;
  afterFormulasValuesUpdate;
  afterGetCellMeta;
  afterGetColHeader;
  afterGetColumnHeaderRenderers;
  afterGetRowHeader;
  afterGetRowHeaderRenderers;
  afterHideColumns;
  afterHideRows;
  afterInit;
  afterLanguageChange;
  afterListen;
  afterLoadData;
  afterMergeCells;
  afterModifyTransformEnd;
  afterModifyTransformFocus;
  afterModifyTransformStart;
  afterMomentumScroll;
  afterNamedExpressionAdded;
  afterNamedExpressionRemoved;
  afterOnCellContextMenu;
  afterOnCellCornerDblClick;
  afterOnCellCornerMouseDown;
  afterOnCellMouseDown;
  afterOnCellMouseOut;
  afterOnCellMouseOver;
  afterOnCellMouseUp;
  afterPaste;
  afterPluginsInitialized;
  afterRedo;
  afterRedoStackChange;
  afterRefreshDimensions;
  afterRemoveCellMeta;
  afterRemoveCol;
  afterRemoveRow;
  afterRender;
  afterRenderer;
  afterRowMove;
  afterRowResize;
  afterRowSequenceChange;
  afterScrollHorizontally;
  afterScrollVertically;
  afterScroll;
  afterSelectColumns;
  afterSelection;
  afterSelectionByProp;
  afterSelectionEnd;
  afterSelectionEndByProp;
  afterSelectionFocusSet;
  afterSelectRows;
  afterSetCellMeta;
  afterSetDataAtCell;
  afterSetDataAtRowProp;
  afterSetSourceDataAtCell;
  afterSheetAdded;
  afterSheetRenamed;
  afterSheetRemoved;
  afterTrimRow;
  afterUndo;
  afterUndoStackChange;
  afterUnhideColumns;
  afterUnhideRows;
  afterUnlisten;
  afterUnmergeCells;
  afterUntrimRow;
  afterUpdateData;
  afterUpdateSettings;
  afterValidate;
  afterViewportColumnCalculatorOverride;
  afterViewportRowCalculatorOverride;
  afterViewRender;
  beforeAddChild;
  beforeAutofill;
  beforeBeginEditing;
  beforeCellAlignment;
  beforeChange;
  beforeChangeRender;
  beforeColumnCollapse;
  beforeColumnExpand;
  beforeColumnFreeze;
  beforeColumnMove;
  beforeColumnResize;
  beforeColumnSort;
  beforeColumnWrap;
  beforeColumnUnfreeze;
  beforeContextMenuSetItems;
  beforeContextMenuShow;
  beforeCopy;
  beforeCreateCol;
  beforeCreateRow;
  beforeCut;
  beforeDetachChild;
  beforeDrawBorders;
  beforeDropdownMenuSetItems;
  beforeDropdownMenuShow;
  beforeFilter;
  beforeGetCellMeta;
  beforeHideColumns;
  beforeHideRows;
  beforeHighlightingColumnHeader;
  beforeHighlightingRowHeader;
  beforeInit;
  beforeInitWalkontable;
  beforeKeyDown;
  beforeLanguageChange;
  beforeLoadData;
  beforeMergeCells;
  beforeOnCellContextMenu;
  beforeOnCellMouseDown;
  beforeOnCellMouseOut;
  beforeOnCellMouseOver;
  beforeOnCellMouseUp;
  beforePaste;
  beforeRedo;
  beforeRedoStackChange;
  beforeRefreshDimensions;
  beforeRemoveCellClassNames;
  beforeRemoveCellMeta;
  beforeRemoveCol;
  beforeRemoveRow;
  beforeRender;
  beforeRenderer;
  beforeRowMove;
  beforeRowResize;
  beforeRowWrap;
  beforeSelectColumns;
  beforeSelectionFocusSet;
  beforeSelectionHighlightSet;
  beforeSelectRows;
  beforeSetCellMeta;
  beforeSetRangeEnd;
  beforeSetRangeStart;
  beforeSetRangeStartOnly;
  beforeStretchingColumnWidth;
  beforeTouchScroll;
  beforeTrimRow;
  beforeUndo;
  beforeUndoStackChange;
  beforeUnhideColumns;
  beforeUnhideRows;
  beforeUnmergeCells;
  beforeUntrimRow;
  beforeUpdateData;
  beforeValidate;
  beforeValueRender;
  beforeViewportScroll;
  beforeViewportScrollHorizontally;
  beforeViewportScrollVertically;
  beforeViewRender;
  construct;
  init;
  modifyAutoColumnSizeSeed;
  modifyAutofillRange;
  modifyColHeader;
  modifyColumnHeaderHeight;
  modifyColumnHeaderValue;
  modifyColWidth;
  modifyCopyableRange;
  modifyFiltersMultiSelectValue;
  modifyFocusedElement;
  modifyData;
  modifyFocusOnTabNavigation;
  modifyGetCellCoords;
  modifyRowData;
  modifyRowHeader;
  modifyRowHeaderWidth;
  modifyRowHeight;
  modifyRowHeightByOverlayName;
  modifySourceData;
  modifyTransformEnd;
  modifyTransformFocus;
  modifyTransformStart;
  persistentStateLoad;
  persistentStateReset;
  persistentStateSave;
  constructor(_hotTableRegisterer, _hotSettingsResolver, ngZone) {
    this._hotTableRegisterer = _hotTableRegisterer;
    this._hotSettingsResolver = _hotSettingsResolver;
    this.ngZone = ngZone;
  }
  get hotInstance() {
    if (!this.__hotInstance || this.__hotInstance && !this.__hotInstance.isDestroyed) {
      return this.__hotInstance;
    } else {
      this._hotTableRegisterer.removeInstance(this.hotId);
      console.warn(HOT_DESTROYED_WARNING);
      return null;
    }
  }
  set hotInstance(hotInstance) {
    this.__hotInstance = hotInstance;
  }
  ngAfterViewInit() {
    const options = this._hotSettingsResolver.mergeSettings(this);
    if (this.columnsComponents.length > 0) {
      const columns = [];
      this.columnsComponents.forEach((column) => {
        columns.push(this._hotSettingsResolver.mergeSettings(column));
      });
      options["columns"] = columns;
    }
    this.ngZone.runOutsideAngular(() => {
      this.hotInstance = new base_default.Core(this.container.nativeElement, options);
      if (this.hotId) {
        this._hotTableRegisterer.registerInstance(this.hotId, this.hotInstance);
      }
      this.hotInstance.init();
    });
  }
  ngOnChanges(changes) {
    if (this.hotInstance === null) {
      return;
    }
    const newOptions = this._hotSettingsResolver.prepareChanges(changes);
    this.updateHotTable(newOptions);
  }
  ngOnDestroy() {
    this.ngZone.runOutsideAngular(() => {
      if (this.hotInstance) {
        this.hotInstance.destroy();
      }
    });
    if (this.hotId) {
      this._hotTableRegisterer.removeInstance(this.hotId);
    }
  }
  updateHotTable(newSettings) {
    if (!this.hotInstance) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.hotInstance.updateSettings(newSettings, false);
    });
  }
  onAfterColumnsChange() {
    if (this.columnsComponents === void 0) {
      return;
    }
    if (this.columnsComponents.length > 0) {
      const columns = [];
      this.columnsComponents.forEach((column) => {
        columns.push(this._hotSettingsResolver.mergeSettings(column));
      });
      const newOptions = {
        columns
      };
      this.updateHotTable(newOptions);
    }
  }
  onAfterColumnsNumberChange() {
    const columns = [];
    if (this.columnsComponents.length > 0) {
      this.columnsComponents.forEach((column) => {
        columns.push(this._hotSettingsResolver.mergeSettings(column));
      });
    }
    this.updateHotTable({
      columns
    });
  }
  addColumn(column) {
    this.columnsComponents.push(column);
    this.onAfterColumnsNumberChange();
  }
  removeColumn(column) {
    const index = this.columnsComponents.indexOf(column);
    this.columnsComponents.splice(index, 1);
    this.onAfterColumnsNumberChange();
  }
  static ɵfac = function HotTableComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HotTableComponent)(ɵɵdirectiveInject(HotTableRegisterer), ɵɵdirectiveInject(HotSettingsResolver), ɵɵdirectiveInject(NgZone));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _HotTableComponent,
    selectors: [["hot-table"]],
    viewQuery: function HotTableComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.container = _t.first);
      }
    },
    inputs: {
      settings: "settings",
      hotId: "hotId",
      activeHeaderClassName: "activeHeaderClassName",
      allowEmpty: "allowEmpty",
      allowHtml: "allowHtml",
      allowInsertColumn: "allowInsertColumn",
      allowInsertRow: "allowInsertRow",
      allowInvalid: "allowInvalid",
      allowRemoveColumn: "allowRemoveColumn",
      allowRemoveRow: "allowRemoveRow",
      ariaTags: "ariaTags",
      autoColumnSize: "autoColumnSize",
      autoRowSize: "autoRowSize",
      autoWrapCol: "autoWrapCol",
      autoWrapRow: "autoWrapRow",
      bindRowsWithHeaders: "bindRowsWithHeaders",
      cell: "cell",
      cells: "cells",
      checkedTemplate: "checkedTemplate",
      className: "className",
      colHeaders: "colHeaders",
      collapsibleColumns: "collapsibleColumns",
      columnHeaderHeight: "columnHeaderHeight",
      columns: "columns",
      columnSorting: "columnSorting",
      columnSummary: "columnSummary",
      colWidths: "colWidths",
      commentedCellClassName: "commentedCellClassName",
      comments: "comments",
      contextMenu: "contextMenu",
      copyable: "copyable",
      copyPaste: "copyPaste",
      correctFormat: "correctFormat",
      currentColClassName: "currentColClassName",
      currentHeaderClassName: "currentHeaderClassName",
      currentRowClassName: "currentRowClassName",
      customBorders: "customBorders",
      data: "data",
      dataDotNotation: "dataDotNotation",
      dataSchema: "dataSchema",
      dateFormat: "dateFormat",
      datePickerConfig: "datePickerConfig",
      defaultDate: "defaultDate",
      tabNavigation: "tabNavigation",
      disableVisualSelection: "disableVisualSelection",
      dragToScroll: "dragToScroll",
      dropdownMenu: "dropdownMenu",
      editor: "editor",
      enterBeginsEditing: "enterBeginsEditing",
      enterMoves: "enterMoves",
      fillHandle: "fillHandle",
      filter: "filter",
      filteringCaseSensitive: "filteringCaseSensitive",
      filters: "filters",
      fixedColumnsLeft: "fixedColumnsLeft",
      fixedColumnsStart: "fixedColumnsStart",
      fixedRowsBottom: "fixedRowsBottom",
      fixedRowsTop: "fixedRowsTop",
      formulas: "formulas",
      fragmentSelection: "fragmentSelection",
      headerClassName: "headerClassName",
      height: "height",
      hiddenColumns: "hiddenColumns",
      hiddenRows: "hiddenRows",
      invalidCellClassName: "invalidCellClassName",
      imeFastEdit: "imeFastEdit",
      label: "label",
      language: "language",
      layoutDirection: "layoutDirection",
      licenseKey: "licenseKey",
      locale: "locale",
      manualColumnFreeze: "manualColumnFreeze",
      manualColumnMove: "manualColumnMove",
      manualColumnResize: "manualColumnResize",
      manualRowMove: "manualRowMove",
      manualRowResize: "manualRowResize",
      maxCols: "maxCols",
      maxRows: "maxRows",
      mergeCells: "mergeCells",
      minCols: "minCols",
      minRows: "minRows",
      minSpareCols: "minSpareCols",
      minSpareRows: "minSpareRows",
      multiColumnSorting: "multiColumnSorting",
      navigableHeaders: "navigableHeaders",
      nestedHeaders: "nestedHeaders",
      nestedRows: "nestedRows",
      noWordWrapClassName: "noWordWrapClassName",
      numericFormat: "numericFormat",
      observeDOMVisibility: "observeDOMVisibility",
      outsideClickDeselects: "outsideClickDeselects",
      persistentState: "persistentState",
      placeholder: "placeholder",
      placeholderCellClassName: "placeholderCellClassName",
      preventOverflow: "preventOverflow",
      preventWheel: "preventWheel",
      readOnly: "readOnly",
      readOnlyCellClassName: "readOnlyCellClassName",
      renderAllColumns: "renderAllColumns",
      renderAllRows: "renderAllRows",
      renderer: "renderer",
      rowHeaders: "rowHeaders",
      rowHeaderWidth: "rowHeaderWidth",
      rowHeights: "rowHeights",
      search: "search",
      selectionMode: "selectionMode",
      selectOptions: "selectOptions",
      skipColumnOnPaste: "skipColumnOnPaste",
      skipRowOnPaste: "skipRowOnPaste",
      sortByRelevance: "sortByRelevance",
      source: "source",
      startCols: "startCols",
      startRows: "startRows",
      stretchH: "stretchH",
      strict: "strict",
      tableClassName: "tableClassName",
      tabMoves: "tabMoves",
      title: "title",
      trimDropdown: "trimDropdown",
      trimRows: "trimRows",
      trimWhitespace: "trimWhitespace",
      type: "type",
      uncheckedTemplate: "uncheckedTemplate",
      undo: "undo",
      validator: "validator",
      viewportColumnRenderingOffset: "viewportColumnRenderingOffset",
      viewportRowRenderingOffset: "viewportRowRenderingOffset",
      visibleRows: "visibleRows",
      width: "width",
      wordWrap: "wordWrap",
      afterAddChild: "afterAddChild",
      afterAutofill: "afterAutofill",
      afterBeginEditing: "afterBeginEditing",
      afterCellMetaReset: "afterCellMetaReset",
      afterChange: "afterChange",
      afterChangesObserved: "afterChangesObserved",
      afterColumnCollapse: "afterColumnCollapse",
      afterColumnExpand: "afterColumnExpand",
      afterColumnFreeze: "afterColumnFreeze",
      afterColumnMove: "afterColumnMove",
      afterColumnResize: "afterColumnResize",
      afterColumnSequenceChange: "afterColumnSequenceChange",
      afterColumnSort: "afterColumnSort",
      afterColumnUnfreeze: "afterColumnUnfreeze",
      afterContextMenuDefaultOptions: "afterContextMenuDefaultOptions",
      afterContextMenuHide: "afterContextMenuHide",
      afterContextMenuShow: "afterContextMenuShow",
      afterCopy: "afterCopy",
      afterCopyLimit: "afterCopyLimit",
      afterCreateCol: "afterCreateCol",
      afterCreateRow: "afterCreateRow",
      afterCut: "afterCut",
      afterDeselect: "afterDeselect",
      afterDestroy: "afterDestroy",
      afterDetachChild: "afterDetachChild",
      afterDocumentKeyDown: "afterDocumentKeyDown",
      afterDrawSelection: "afterDrawSelection",
      afterDropdownMenuDefaultOptions: "afterDropdownMenuDefaultOptions",
      afterDropdownMenuHide: "afterDropdownMenuHide",
      afterDropdownMenuShow: "afterDropdownMenuShow",
      afterFilter: "afterFilter",
      afterFormulasValuesUpdate: "afterFormulasValuesUpdate",
      afterGetCellMeta: "afterGetCellMeta",
      afterGetColHeader: "afterGetColHeader",
      afterGetColumnHeaderRenderers: "afterGetColumnHeaderRenderers",
      afterGetRowHeader: "afterGetRowHeader",
      afterGetRowHeaderRenderers: "afterGetRowHeaderRenderers",
      afterHideColumns: "afterHideColumns",
      afterHideRows: "afterHideRows",
      afterInit: "afterInit",
      afterLanguageChange: "afterLanguageChange",
      afterListen: "afterListen",
      afterLoadData: "afterLoadData",
      afterMergeCells: "afterMergeCells",
      afterModifyTransformEnd: "afterModifyTransformEnd",
      afterModifyTransformFocus: "afterModifyTransformFocus",
      afterModifyTransformStart: "afterModifyTransformStart",
      afterMomentumScroll: "afterMomentumScroll",
      afterNamedExpressionAdded: "afterNamedExpressionAdded",
      afterNamedExpressionRemoved: "afterNamedExpressionRemoved",
      afterOnCellContextMenu: "afterOnCellContextMenu",
      afterOnCellCornerDblClick: "afterOnCellCornerDblClick",
      afterOnCellCornerMouseDown: "afterOnCellCornerMouseDown",
      afterOnCellMouseDown: "afterOnCellMouseDown",
      afterOnCellMouseOut: "afterOnCellMouseOut",
      afterOnCellMouseOver: "afterOnCellMouseOver",
      afterOnCellMouseUp: "afterOnCellMouseUp",
      afterPaste: "afterPaste",
      afterPluginsInitialized: "afterPluginsInitialized",
      afterRedo: "afterRedo",
      afterRedoStackChange: "afterRedoStackChange",
      afterRefreshDimensions: "afterRefreshDimensions",
      afterRemoveCellMeta: "afterRemoveCellMeta",
      afterRemoveCol: "afterRemoveCol",
      afterRemoveRow: "afterRemoveRow",
      afterRender: "afterRender",
      afterRenderer: "afterRenderer",
      afterRowMove: "afterRowMove",
      afterRowResize: "afterRowResize",
      afterRowSequenceChange: "afterRowSequenceChange",
      afterScrollHorizontally: "afterScrollHorizontally",
      afterScrollVertically: "afterScrollVertically",
      afterScroll: "afterScroll",
      afterSelectColumns: "afterSelectColumns",
      afterSelection: "afterSelection",
      afterSelectionByProp: "afterSelectionByProp",
      afterSelectionEnd: "afterSelectionEnd",
      afterSelectionEndByProp: "afterSelectionEndByProp",
      afterSelectionFocusSet: "afterSelectionFocusSet",
      afterSelectRows: "afterSelectRows",
      afterSetCellMeta: "afterSetCellMeta",
      afterSetDataAtCell: "afterSetDataAtCell",
      afterSetDataAtRowProp: "afterSetDataAtRowProp",
      afterSetSourceDataAtCell: "afterSetSourceDataAtCell",
      afterSheetAdded: "afterSheetAdded",
      afterSheetRenamed: "afterSheetRenamed",
      afterSheetRemoved: "afterSheetRemoved",
      afterTrimRow: "afterTrimRow",
      afterUndo: "afterUndo",
      afterUndoStackChange: "afterUndoStackChange",
      afterUnhideColumns: "afterUnhideColumns",
      afterUnhideRows: "afterUnhideRows",
      afterUnlisten: "afterUnlisten",
      afterUnmergeCells: "afterUnmergeCells",
      afterUntrimRow: "afterUntrimRow",
      afterUpdateData: "afterUpdateData",
      afterUpdateSettings: "afterUpdateSettings",
      afterValidate: "afterValidate",
      afterViewportColumnCalculatorOverride: "afterViewportColumnCalculatorOverride",
      afterViewportRowCalculatorOverride: "afterViewportRowCalculatorOverride",
      afterViewRender: "afterViewRender",
      beforeAddChild: "beforeAddChild",
      beforeAutofill: "beforeAutofill",
      beforeBeginEditing: "beforeBeginEditing",
      beforeCellAlignment: "beforeCellAlignment",
      beforeChange: "beforeChange",
      beforeChangeRender: "beforeChangeRender",
      beforeColumnCollapse: "beforeColumnCollapse",
      beforeColumnExpand: "beforeColumnExpand",
      beforeColumnFreeze: "beforeColumnFreeze",
      beforeColumnMove: "beforeColumnMove",
      beforeColumnResize: "beforeColumnResize",
      beforeColumnSort: "beforeColumnSort",
      beforeColumnWrap: "beforeColumnWrap",
      beforeColumnUnfreeze: "beforeColumnUnfreeze",
      beforeContextMenuSetItems: "beforeContextMenuSetItems",
      beforeContextMenuShow: "beforeContextMenuShow",
      beforeCopy: "beforeCopy",
      beforeCreateCol: "beforeCreateCol",
      beforeCreateRow: "beforeCreateRow",
      beforeCut: "beforeCut",
      beforeDetachChild: "beforeDetachChild",
      beforeDrawBorders: "beforeDrawBorders",
      beforeDropdownMenuSetItems: "beforeDropdownMenuSetItems",
      beforeDropdownMenuShow: "beforeDropdownMenuShow",
      beforeFilter: "beforeFilter",
      beforeGetCellMeta: "beforeGetCellMeta",
      beforeHideColumns: "beforeHideColumns",
      beforeHideRows: "beforeHideRows",
      beforeHighlightingColumnHeader: "beforeHighlightingColumnHeader",
      beforeHighlightingRowHeader: "beforeHighlightingRowHeader",
      beforeInit: "beforeInit",
      beforeInitWalkontable: "beforeInitWalkontable",
      beforeKeyDown: "beforeKeyDown",
      beforeLanguageChange: "beforeLanguageChange",
      beforeLoadData: "beforeLoadData",
      beforeMergeCells: "beforeMergeCells",
      beforeOnCellContextMenu: "beforeOnCellContextMenu",
      beforeOnCellMouseDown: "beforeOnCellMouseDown",
      beforeOnCellMouseOut: "beforeOnCellMouseOut",
      beforeOnCellMouseOver: "beforeOnCellMouseOver",
      beforeOnCellMouseUp: "beforeOnCellMouseUp",
      beforePaste: "beforePaste",
      beforeRedo: "beforeRedo",
      beforeRedoStackChange: "beforeRedoStackChange",
      beforeRefreshDimensions: "beforeRefreshDimensions",
      beforeRemoveCellClassNames: "beforeRemoveCellClassNames",
      beforeRemoveCellMeta: "beforeRemoveCellMeta",
      beforeRemoveCol: "beforeRemoveCol",
      beforeRemoveRow: "beforeRemoveRow",
      beforeRender: "beforeRender",
      beforeRenderer: "beforeRenderer",
      beforeRowMove: "beforeRowMove",
      beforeRowResize: "beforeRowResize",
      beforeRowWrap: "beforeRowWrap",
      beforeSelectColumns: "beforeSelectColumns",
      beforeSelectionFocusSet: "beforeSelectionFocusSet",
      beforeSelectionHighlightSet: "beforeSelectionHighlightSet",
      beforeSelectRows: "beforeSelectRows",
      beforeSetCellMeta: "beforeSetCellMeta",
      beforeSetRangeEnd: "beforeSetRangeEnd",
      beforeSetRangeStart: "beforeSetRangeStart",
      beforeSetRangeStartOnly: "beforeSetRangeStartOnly",
      beforeStretchingColumnWidth: "beforeStretchingColumnWidth",
      beforeTouchScroll: "beforeTouchScroll",
      beforeTrimRow: "beforeTrimRow",
      beforeUndo: "beforeUndo",
      beforeUndoStackChange: "beforeUndoStackChange",
      beforeUnhideColumns: "beforeUnhideColumns",
      beforeUnhideRows: "beforeUnhideRows",
      beforeUnmergeCells: "beforeUnmergeCells",
      beforeUntrimRow: "beforeUntrimRow",
      beforeUpdateData: "beforeUpdateData",
      beforeValidate: "beforeValidate",
      beforeValueRender: "beforeValueRender",
      beforeViewportScroll: "beforeViewportScroll",
      beforeViewportScrollHorizontally: "beforeViewportScrollHorizontally",
      beforeViewportScrollVertically: "beforeViewportScrollVertically",
      beforeViewRender: "beforeViewRender",
      construct: "construct",
      init: "init",
      modifyAutoColumnSizeSeed: "modifyAutoColumnSizeSeed",
      modifyAutofillRange: "modifyAutofillRange",
      modifyColHeader: "modifyColHeader",
      modifyColumnHeaderHeight: "modifyColumnHeaderHeight",
      modifyColumnHeaderValue: "modifyColumnHeaderValue",
      modifyColWidth: "modifyColWidth",
      modifyCopyableRange: "modifyCopyableRange",
      modifyFiltersMultiSelectValue: "modifyFiltersMultiSelectValue",
      modifyFocusedElement: "modifyFocusedElement",
      modifyData: "modifyData",
      modifyFocusOnTabNavigation: "modifyFocusOnTabNavigation",
      modifyGetCellCoords: "modifyGetCellCoords",
      modifyRowData: "modifyRowData",
      modifyRowHeader: "modifyRowHeader",
      modifyRowHeaderWidth: "modifyRowHeaderWidth",
      modifyRowHeight: "modifyRowHeight",
      modifyRowHeightByOverlayName: "modifyRowHeightByOverlayName",
      modifySourceData: "modifySourceData",
      modifyTransformEnd: "modifyTransformEnd",
      modifyTransformFocus: "modifyTransformFocus",
      modifyTransformStart: "modifyTransformStart",
      persistentStateLoad: "persistentStateLoad",
      persistentStateReset: "persistentStateReset",
      persistentStateSave: "persistentStateSave"
    },
    features: [ɵɵProvidersFeature([HotTableRegisterer, HotSettingsResolver]), ɵɵNgOnChangesFeature],
    decls: 2,
    vars: 1,
    consts: [["container", ""], [3, "id"]],
    template: function HotTableComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelement(0, "div", 1, 0);
      }
      if (rf & 2) {
        ɵɵproperty("id", ctx.hotId);
      }
    },
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HotTableComponent, [{
    type: Component,
    args: [{
      selector: "hot-table",
      template: '<div #container [id]="hotId"></div>',
      encapsulation: ViewEncapsulation$1.None,
      providers: [HotTableRegisterer, HotSettingsResolver]
    }]
  }], () => [{
    type: HotTableRegisterer
  }, {
    type: HotSettingsResolver
  }, {
    type: NgZone
  }], {
    container: [{
      type: ViewChild,
      args: ["container", {
        static: false
      }]
    }],
    settings: [{
      type: Input
    }],
    hotId: [{
      type: Input
    }],
    activeHeaderClassName: [{
      type: Input
    }],
    allowEmpty: [{
      type: Input
    }],
    allowHtml: [{
      type: Input
    }],
    allowInsertColumn: [{
      type: Input
    }],
    allowInsertRow: [{
      type: Input
    }],
    allowInvalid: [{
      type: Input
    }],
    allowRemoveColumn: [{
      type: Input
    }],
    allowRemoveRow: [{
      type: Input
    }],
    ariaTags: [{
      type: Input
    }],
    autoColumnSize: [{
      type: Input
    }],
    autoRowSize: [{
      type: Input
    }],
    autoWrapCol: [{
      type: Input
    }],
    autoWrapRow: [{
      type: Input
    }],
    bindRowsWithHeaders: [{
      type: Input
    }],
    cell: [{
      type: Input
    }],
    cells: [{
      type: Input
    }],
    checkedTemplate: [{
      type: Input
    }],
    className: [{
      type: Input
    }],
    colHeaders: [{
      type: Input
    }],
    collapsibleColumns: [{
      type: Input
    }],
    columnHeaderHeight: [{
      type: Input
    }],
    columns: [{
      type: Input
    }],
    columnSorting: [{
      type: Input
    }],
    columnSummary: [{
      type: Input
    }],
    colWidths: [{
      type: Input
    }],
    commentedCellClassName: [{
      type: Input
    }],
    comments: [{
      type: Input
    }],
    contextMenu: [{
      type: Input
    }],
    copyable: [{
      type: Input
    }],
    copyPaste: [{
      type: Input
    }],
    correctFormat: [{
      type: Input
    }],
    currentColClassName: [{
      type: Input
    }],
    currentHeaderClassName: [{
      type: Input
    }],
    currentRowClassName: [{
      type: Input
    }],
    customBorders: [{
      type: Input
    }],
    data: [{
      type: Input
    }],
    dataDotNotation: [{
      type: Input
    }],
    dataSchema: [{
      type: Input
    }],
    dateFormat: [{
      type: Input
    }],
    datePickerConfig: [{
      type: Input
    }],
    defaultDate: [{
      type: Input
    }],
    tabNavigation: [{
      type: Input
    }],
    disableVisualSelection: [{
      type: Input
    }],
    dragToScroll: [{
      type: Input
    }],
    dropdownMenu: [{
      type: Input
    }],
    editor: [{
      type: Input
    }],
    enterBeginsEditing: [{
      type: Input
    }],
    enterMoves: [{
      type: Input
    }],
    fillHandle: [{
      type: Input
    }],
    filter: [{
      type: Input
    }],
    filteringCaseSensitive: [{
      type: Input
    }],
    filters: [{
      type: Input
    }],
    fixedColumnsLeft: [{
      type: Input
    }],
    fixedColumnsStart: [{
      type: Input
    }],
    fixedRowsBottom: [{
      type: Input
    }],
    fixedRowsTop: [{
      type: Input
    }],
    formulas: [{
      type: Input
    }],
    fragmentSelection: [{
      type: Input
    }],
    headerClassName: [{
      type: Input
    }],
    height: [{
      type: Input
    }],
    hiddenColumns: [{
      type: Input
    }],
    hiddenRows: [{
      type: Input
    }],
    invalidCellClassName: [{
      type: Input
    }],
    imeFastEdit: [{
      type: Input
    }],
    label: [{
      type: Input
    }],
    language: [{
      type: Input
    }],
    layoutDirection: [{
      type: Input
    }],
    licenseKey: [{
      type: Input
    }],
    locale: [{
      type: Input
    }],
    manualColumnFreeze: [{
      type: Input
    }],
    manualColumnMove: [{
      type: Input
    }],
    manualColumnResize: [{
      type: Input
    }],
    manualRowMove: [{
      type: Input
    }],
    manualRowResize: [{
      type: Input
    }],
    maxCols: [{
      type: Input
    }],
    maxRows: [{
      type: Input
    }],
    mergeCells: [{
      type: Input
    }],
    minCols: [{
      type: Input
    }],
    minRows: [{
      type: Input
    }],
    minSpareCols: [{
      type: Input
    }],
    minSpareRows: [{
      type: Input
    }],
    multiColumnSorting: [{
      type: Input
    }],
    navigableHeaders: [{
      type: Input
    }],
    nestedHeaders: [{
      type: Input
    }],
    nestedRows: [{
      type: Input
    }],
    noWordWrapClassName: [{
      type: Input
    }],
    numericFormat: [{
      type: Input
    }],
    observeDOMVisibility: [{
      type: Input
    }],
    outsideClickDeselects: [{
      type: Input
    }],
    persistentState: [{
      type: Input
    }],
    placeholder: [{
      type: Input
    }],
    placeholderCellClassName: [{
      type: Input
    }],
    preventOverflow: [{
      type: Input
    }],
    preventWheel: [{
      type: Input
    }],
    readOnly: [{
      type: Input
    }],
    readOnlyCellClassName: [{
      type: Input
    }],
    renderAllColumns: [{
      type: Input
    }],
    renderAllRows: [{
      type: Input
    }],
    renderer: [{
      type: Input
    }],
    rowHeaders: [{
      type: Input
    }],
    rowHeaderWidth: [{
      type: Input
    }],
    rowHeights: [{
      type: Input
    }],
    search: [{
      type: Input
    }],
    selectionMode: [{
      type: Input
    }],
    selectOptions: [{
      type: Input
    }],
    skipColumnOnPaste: [{
      type: Input
    }],
    skipRowOnPaste: [{
      type: Input
    }],
    sortByRelevance: [{
      type: Input
    }],
    source: [{
      type: Input
    }],
    startCols: [{
      type: Input
    }],
    startRows: [{
      type: Input
    }],
    stretchH: [{
      type: Input
    }],
    strict: [{
      type: Input
    }],
    tableClassName: [{
      type: Input
    }],
    tabMoves: [{
      type: Input
    }],
    title: [{
      type: Input
    }],
    trimDropdown: [{
      type: Input
    }],
    trimRows: [{
      type: Input
    }],
    trimWhitespace: [{
      type: Input
    }],
    type: [{
      type: Input
    }],
    uncheckedTemplate: [{
      type: Input
    }],
    undo: [{
      type: Input
    }],
    validator: [{
      type: Input
    }],
    viewportColumnRenderingOffset: [{
      type: Input
    }],
    viewportRowRenderingOffset: [{
      type: Input
    }],
    visibleRows: [{
      type: Input
    }],
    width: [{
      type: Input
    }],
    wordWrap: [{
      type: Input
    }],
    afterAddChild: [{
      type: Input
    }],
    afterAutofill: [{
      type: Input
    }],
    afterBeginEditing: [{
      type: Input
    }],
    afterCellMetaReset: [{
      type: Input
    }],
    afterChange: [{
      type: Input
    }],
    afterChangesObserved: [{
      type: Input
    }],
    afterColumnCollapse: [{
      type: Input
    }],
    afterColumnExpand: [{
      type: Input
    }],
    afterColumnFreeze: [{
      type: Input
    }],
    afterColumnMove: [{
      type: Input
    }],
    afterColumnResize: [{
      type: Input
    }],
    afterColumnSequenceChange: [{
      type: Input
    }],
    afterColumnSort: [{
      type: Input
    }],
    afterColumnUnfreeze: [{
      type: Input
    }],
    afterContextMenuDefaultOptions: [{
      type: Input
    }],
    afterContextMenuHide: [{
      type: Input
    }],
    afterContextMenuShow: [{
      type: Input
    }],
    afterCopy: [{
      type: Input
    }],
    afterCopyLimit: [{
      type: Input
    }],
    afterCreateCol: [{
      type: Input
    }],
    afterCreateRow: [{
      type: Input
    }],
    afterCut: [{
      type: Input
    }],
    afterDeselect: [{
      type: Input
    }],
    afterDestroy: [{
      type: Input
    }],
    afterDetachChild: [{
      type: Input
    }],
    afterDocumentKeyDown: [{
      type: Input
    }],
    afterDrawSelection: [{
      type: Input
    }],
    afterDropdownMenuDefaultOptions: [{
      type: Input
    }],
    afterDropdownMenuHide: [{
      type: Input
    }],
    afterDropdownMenuShow: [{
      type: Input
    }],
    afterFilter: [{
      type: Input
    }],
    afterFormulasValuesUpdate: [{
      type: Input
    }],
    afterGetCellMeta: [{
      type: Input
    }],
    afterGetColHeader: [{
      type: Input
    }],
    afterGetColumnHeaderRenderers: [{
      type: Input
    }],
    afterGetRowHeader: [{
      type: Input
    }],
    afterGetRowHeaderRenderers: [{
      type: Input
    }],
    afterHideColumns: [{
      type: Input
    }],
    afterHideRows: [{
      type: Input
    }],
    afterInit: [{
      type: Input
    }],
    afterLanguageChange: [{
      type: Input
    }],
    afterListen: [{
      type: Input
    }],
    afterLoadData: [{
      type: Input
    }],
    afterMergeCells: [{
      type: Input
    }],
    afterModifyTransformEnd: [{
      type: Input
    }],
    afterModifyTransformFocus: [{
      type: Input
    }],
    afterModifyTransformStart: [{
      type: Input
    }],
    afterMomentumScroll: [{
      type: Input
    }],
    afterNamedExpressionAdded: [{
      type: Input
    }],
    afterNamedExpressionRemoved: [{
      type: Input
    }],
    afterOnCellContextMenu: [{
      type: Input
    }],
    afterOnCellCornerDblClick: [{
      type: Input
    }],
    afterOnCellCornerMouseDown: [{
      type: Input
    }],
    afterOnCellMouseDown: [{
      type: Input
    }],
    afterOnCellMouseOut: [{
      type: Input
    }],
    afterOnCellMouseOver: [{
      type: Input
    }],
    afterOnCellMouseUp: [{
      type: Input
    }],
    afterPaste: [{
      type: Input
    }],
    afterPluginsInitialized: [{
      type: Input
    }],
    afterRedo: [{
      type: Input
    }],
    afterRedoStackChange: [{
      type: Input
    }],
    afterRefreshDimensions: [{
      type: Input
    }],
    afterRemoveCellMeta: [{
      type: Input
    }],
    afterRemoveCol: [{
      type: Input
    }],
    afterRemoveRow: [{
      type: Input
    }],
    afterRender: [{
      type: Input
    }],
    afterRenderer: [{
      type: Input
    }],
    afterRowMove: [{
      type: Input
    }],
    afterRowResize: [{
      type: Input
    }],
    afterRowSequenceChange: [{
      type: Input
    }],
    afterScrollHorizontally: [{
      type: Input
    }],
    afterScrollVertically: [{
      type: Input
    }],
    afterScroll: [{
      type: Input
    }],
    afterSelectColumns: [{
      type: Input
    }],
    afterSelection: [{
      type: Input
    }],
    afterSelectionByProp: [{
      type: Input
    }],
    afterSelectionEnd: [{
      type: Input
    }],
    afterSelectionEndByProp: [{
      type: Input
    }],
    afterSelectionFocusSet: [{
      type: Input
    }],
    afterSelectRows: [{
      type: Input
    }],
    afterSetCellMeta: [{
      type: Input
    }],
    afterSetDataAtCell: [{
      type: Input
    }],
    afterSetDataAtRowProp: [{
      type: Input
    }],
    afterSetSourceDataAtCell: [{
      type: Input
    }],
    afterSheetAdded: [{
      type: Input
    }],
    afterSheetRenamed: [{
      type: Input
    }],
    afterSheetRemoved: [{
      type: Input
    }],
    afterTrimRow: [{
      type: Input
    }],
    afterUndo: [{
      type: Input
    }],
    afterUndoStackChange: [{
      type: Input
    }],
    afterUnhideColumns: [{
      type: Input
    }],
    afterUnhideRows: [{
      type: Input
    }],
    afterUnlisten: [{
      type: Input
    }],
    afterUnmergeCells: [{
      type: Input
    }],
    afterUntrimRow: [{
      type: Input
    }],
    afterUpdateData: [{
      type: Input
    }],
    afterUpdateSettings: [{
      type: Input
    }],
    afterValidate: [{
      type: Input
    }],
    afterViewportColumnCalculatorOverride: [{
      type: Input
    }],
    afterViewportRowCalculatorOverride: [{
      type: Input
    }],
    afterViewRender: [{
      type: Input
    }],
    beforeAddChild: [{
      type: Input
    }],
    beforeAutofill: [{
      type: Input
    }],
    beforeBeginEditing: [{
      type: Input
    }],
    beforeCellAlignment: [{
      type: Input
    }],
    beforeChange: [{
      type: Input
    }],
    beforeChangeRender: [{
      type: Input
    }],
    beforeColumnCollapse: [{
      type: Input
    }],
    beforeColumnExpand: [{
      type: Input
    }],
    beforeColumnFreeze: [{
      type: Input
    }],
    beforeColumnMove: [{
      type: Input
    }],
    beforeColumnResize: [{
      type: Input
    }],
    beforeColumnSort: [{
      type: Input
    }],
    beforeColumnWrap: [{
      type: Input
    }],
    beforeColumnUnfreeze: [{
      type: Input
    }],
    beforeContextMenuSetItems: [{
      type: Input
    }],
    beforeContextMenuShow: [{
      type: Input
    }],
    beforeCopy: [{
      type: Input
    }],
    beforeCreateCol: [{
      type: Input
    }],
    beforeCreateRow: [{
      type: Input
    }],
    beforeCut: [{
      type: Input
    }],
    beforeDetachChild: [{
      type: Input
    }],
    beforeDrawBorders: [{
      type: Input
    }],
    beforeDropdownMenuSetItems: [{
      type: Input
    }],
    beforeDropdownMenuShow: [{
      type: Input
    }],
    beforeFilter: [{
      type: Input
    }],
    beforeGetCellMeta: [{
      type: Input
    }],
    beforeHideColumns: [{
      type: Input
    }],
    beforeHideRows: [{
      type: Input
    }],
    beforeHighlightingColumnHeader: [{
      type: Input
    }],
    beforeHighlightingRowHeader: [{
      type: Input
    }],
    beforeInit: [{
      type: Input
    }],
    beforeInitWalkontable: [{
      type: Input
    }],
    beforeKeyDown: [{
      type: Input
    }],
    beforeLanguageChange: [{
      type: Input
    }],
    beforeLoadData: [{
      type: Input
    }],
    beforeMergeCells: [{
      type: Input
    }],
    beforeOnCellContextMenu: [{
      type: Input
    }],
    beforeOnCellMouseDown: [{
      type: Input
    }],
    beforeOnCellMouseOut: [{
      type: Input
    }],
    beforeOnCellMouseOver: [{
      type: Input
    }],
    beforeOnCellMouseUp: [{
      type: Input
    }],
    beforePaste: [{
      type: Input
    }],
    beforeRedo: [{
      type: Input
    }],
    beforeRedoStackChange: [{
      type: Input
    }],
    beforeRefreshDimensions: [{
      type: Input
    }],
    beforeRemoveCellClassNames: [{
      type: Input
    }],
    beforeRemoveCellMeta: [{
      type: Input
    }],
    beforeRemoveCol: [{
      type: Input
    }],
    beforeRemoveRow: [{
      type: Input
    }],
    beforeRender: [{
      type: Input
    }],
    beforeRenderer: [{
      type: Input
    }],
    beforeRowMove: [{
      type: Input
    }],
    beforeRowResize: [{
      type: Input
    }],
    beforeRowWrap: [{
      type: Input
    }],
    beforeSelectColumns: [{
      type: Input
    }],
    beforeSelectionFocusSet: [{
      type: Input
    }],
    beforeSelectionHighlightSet: [{
      type: Input
    }],
    beforeSelectRows: [{
      type: Input
    }],
    beforeSetCellMeta: [{
      type: Input
    }],
    beforeSetRangeEnd: [{
      type: Input
    }],
    beforeSetRangeStart: [{
      type: Input
    }],
    beforeSetRangeStartOnly: [{
      type: Input
    }],
    beforeStretchingColumnWidth: [{
      type: Input
    }],
    beforeTouchScroll: [{
      type: Input
    }],
    beforeTrimRow: [{
      type: Input
    }],
    beforeUndo: [{
      type: Input
    }],
    beforeUndoStackChange: [{
      type: Input
    }],
    beforeUnhideColumns: [{
      type: Input
    }],
    beforeUnhideRows: [{
      type: Input
    }],
    beforeUnmergeCells: [{
      type: Input
    }],
    beforeUntrimRow: [{
      type: Input
    }],
    beforeUpdateData: [{
      type: Input
    }],
    beforeValidate: [{
      type: Input
    }],
    beforeValueRender: [{
      type: Input
    }],
    beforeViewportScroll: [{
      type: Input
    }],
    beforeViewportScrollHorizontally: [{
      type: Input
    }],
    beforeViewportScrollVertically: [{
      type: Input
    }],
    beforeViewRender: [{
      type: Input
    }],
    construct: [{
      type: Input
    }],
    init: [{
      type: Input
    }],
    modifyAutoColumnSizeSeed: [{
      type: Input
    }],
    modifyAutofillRange: [{
      type: Input
    }],
    modifyColHeader: [{
      type: Input
    }],
    modifyColumnHeaderHeight: [{
      type: Input
    }],
    modifyColumnHeaderValue: [{
      type: Input
    }],
    modifyColWidth: [{
      type: Input
    }],
    modifyCopyableRange: [{
      type: Input
    }],
    modifyFiltersMultiSelectValue: [{
      type: Input
    }],
    modifyFocusedElement: [{
      type: Input
    }],
    modifyData: [{
      type: Input
    }],
    modifyFocusOnTabNavigation: [{
      type: Input
    }],
    modifyGetCellCoords: [{
      type: Input
    }],
    modifyRowData: [{
      type: Input
    }],
    modifyRowHeader: [{
      type: Input
    }],
    modifyRowHeaderWidth: [{
      type: Input
    }],
    modifyRowHeight: [{
      type: Input
    }],
    modifyRowHeightByOverlayName: [{
      type: Input
    }],
    modifySourceData: [{
      type: Input
    }],
    modifyTransformEnd: [{
      type: Input
    }],
    modifyTransformFocus: [{
      type: Input
    }],
    modifyTransformStart: [{
      type: Input
    }],
    persistentStateLoad: [{
      type: Input
    }],
    persistentStateReset: [{
      type: Input
    }],
    persistentStateSave: [{
      type: Input
    }]
  });
})();
var HotColumnComponent = class _HotColumnComponent {
  parentComponent;
  firstRun = true;
  // handsontable column options
  allowEmpty;
  allowHtml;
  allowInvalid;
  checkedTemplate;
  className;
  columnSorting;
  colWidths;
  commentedCellClassName;
  copyable;
  correctFormat;
  data;
  dateFormat;
  defaultDate;
  editor;
  filteringCaseSensitive;
  headerClassName;
  invalidCellClassName;
  label;
  language;
  noWordWrapClassName;
  numericFormat;
  placeholder;
  placeholderCellClassName;
  readOnly;
  readOnlyCellClassName;
  renderer;
  selectOptions;
  skipColumnOnPaste;
  sortByRelevance;
  source;
  strict;
  title;
  trimDropdown;
  type;
  uncheckedTemplate;
  validator;
  visibleRows;
  width;
  wordWrap;
  constructor(parentComponent) {
    this.parentComponent = parentComponent;
  }
  ngOnInit() {
    this.firstRun = false;
    this.parentComponent.addColumn(this);
  }
  ngOnChanges() {
    if (this.firstRun) {
      return;
    }
    this.parentComponent.onAfterColumnsChange();
  }
  ngOnDestroy() {
    this.parentComponent.removeColumn(this);
  }
  static ɵfac = function HotColumnComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HotColumnComponent)(ɵɵdirectiveInject(HotTableComponent));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _HotColumnComponent,
    selectors: [["hot-column"]],
    inputs: {
      allowEmpty: "allowEmpty",
      allowHtml: "allowHtml",
      allowInvalid: "allowInvalid",
      checkedTemplate: "checkedTemplate",
      className: "className",
      columnSorting: "columnSorting",
      colWidths: "colWidths",
      commentedCellClassName: "commentedCellClassName",
      copyable: "copyable",
      correctFormat: "correctFormat",
      data: "data",
      dateFormat: "dateFormat",
      defaultDate: "defaultDate",
      editor: "editor",
      filteringCaseSensitive: "filteringCaseSensitive",
      headerClassName: "headerClassName",
      invalidCellClassName: "invalidCellClassName",
      label: "label",
      language: "language",
      noWordWrapClassName: "noWordWrapClassName",
      numericFormat: "numericFormat",
      placeholder: "placeholder",
      placeholderCellClassName: "placeholderCellClassName",
      readOnly: "readOnly",
      readOnlyCellClassName: "readOnlyCellClassName",
      renderer: "renderer",
      selectOptions: "selectOptions",
      skipColumnOnPaste: "skipColumnOnPaste",
      sortByRelevance: "sortByRelevance",
      source: "source",
      strict: "strict",
      title: "title",
      trimDropdown: "trimDropdown",
      type: "type",
      uncheckedTemplate: "uncheckedTemplate",
      validator: "validator",
      visibleRows: "visibleRows",
      width: "width",
      wordWrap: "wordWrap"
    },
    features: [ɵɵNgOnChangesFeature],
    decls: 0,
    vars: 0,
    template: function HotColumnComponent_Template(rf, ctx) {
    },
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HotColumnComponent, [{
    type: Component,
    args: [{
      selector: "hot-column",
      template: ""
    }]
  }], () => [{
    type: HotTableComponent
  }], {
    allowEmpty: [{
      type: Input
    }],
    allowHtml: [{
      type: Input
    }],
    allowInvalid: [{
      type: Input
    }],
    checkedTemplate: [{
      type: Input
    }],
    className: [{
      type: Input
    }],
    columnSorting: [{
      type: Input
    }],
    colWidths: [{
      type: Input
    }],
    commentedCellClassName: [{
      type: Input
    }],
    copyable: [{
      type: Input
    }],
    correctFormat: [{
      type: Input
    }],
    data: [{
      type: Input
    }],
    dateFormat: [{
      type: Input
    }],
    defaultDate: [{
      type: Input
    }],
    editor: [{
      type: Input
    }],
    filteringCaseSensitive: [{
      type: Input
    }],
    headerClassName: [{
      type: Input
    }],
    invalidCellClassName: [{
      type: Input
    }],
    label: [{
      type: Input
    }],
    language: [{
      type: Input
    }],
    noWordWrapClassName: [{
      type: Input
    }],
    numericFormat: [{
      type: Input
    }],
    placeholder: [{
      type: Input
    }],
    placeholderCellClassName: [{
      type: Input
    }],
    readOnly: [{
      type: Input
    }],
    readOnlyCellClassName: [{
      type: Input
    }],
    renderer: [{
      type: Input
    }],
    selectOptions: [{
      type: Input
    }],
    skipColumnOnPaste: [{
      type: Input
    }],
    sortByRelevance: [{
      type: Input
    }],
    source: [{
      type: Input
    }],
    strict: [{
      type: Input
    }],
    title: [{
      type: Input
    }],
    trimDropdown: [{
      type: Input
    }],
    type: [{
      type: Input
    }],
    uncheckedTemplate: [{
      type: Input
    }],
    validator: [{
      type: Input
    }],
    visibleRows: [{
      type: Input
    }],
    width: [{
      type: Input
    }],
    wordWrap: [{
      type: Input
    }]
  });
})();
var HotTableModule = class _HotTableModule {
  static version = "14.5.0";
  static forRoot() {
    return {
      ngModule: _HotTableModule,
      providers: [HotTableRegisterer]
    };
  }
  static ɵfac = function HotTableModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _HotTableModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _HotTableModule,
    declarations: [HotTableComponent, HotColumnComponent],
    exports: [HotTableComponent, HotColumnComponent]
  });
  static ɵinj = ɵɵdefineInjector({});
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HotTableModule, [{
    type: NgModule,
    args: [{
      declarations: [HotTableComponent, HotColumnComponent],
      exports: [HotTableComponent, HotColumnComponent]
    }]
  }], null, null);
})();
export {
  HOT_DESTROYED_WARNING,
  HotColumnComponent,
  HotSettingsResolver,
  HotTableComponent,
  HotTableModule,
  HotTableRegisterer
};
//# sourceMappingURL=@handsontable_angular.js.map

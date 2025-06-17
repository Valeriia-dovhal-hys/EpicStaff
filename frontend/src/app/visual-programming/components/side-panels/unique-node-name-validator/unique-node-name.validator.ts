import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function uniqueNodeNameValidator(
  getExistingNames: () => string[],
  currentName?: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null; // Let required validator handle empty values.
    }

    const nodeName = value.trim();

    // If the node name hasn't changed, skip the uniqueness check.
    if (currentName && nodeName === currentName.trim()) {
      return null;
    }

    const existingNames = getExistingNames().map((name) => name.trim());

    if (existingNames.includes(nodeName)) {
      return { uniqueNodeName: { message: 'Node name must be unique.' } };
    }
    return null;
  };
}

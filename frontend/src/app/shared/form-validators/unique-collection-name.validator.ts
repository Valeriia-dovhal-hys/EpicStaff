import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { GetSourceCollectionRequest } from '../../pages/knowledge-sources/models/source-collection.model';

export function uniqueCollectionNameValidator(
  collections: GetSourceCollectionRequest[]
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const name = control.value;
    if (!name || !collections || collections.length === 0) {
      return null;
    }

    const isDuplicate = collections.some(
      (collection) =>
        collection.collection_name.toLowerCase() === name.toLowerCase()
    );

    return isDuplicate ? { duplicateName: true } : null;
  };
}

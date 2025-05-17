from typing import TypedDict, _TypedDictMeta
import types
import pandas as pd

def create_typeddict(name, fields):
    """Create a TypedDict type dynamically using the proper TypedDict metaclass."""
    return types.new_class(name, (TypedDict,), {'metaclass': _TypedDictMeta}, lambda ns: ns.update(__annotations__=fields))

class Entities:
    def __new__(cls, data_frame: pd.DataFrame):
        return cls.create_typed_entities_from_df(data_frame)

    @staticmethod
    def create_typed_entities_from_df(data_frame: pd.DataFrame):
        """Creates dynamically typed entities based on the DataFrame definitions."""
        typed_entities = {}
        #TODO remove the for loop
        for _, row in data_frame.iterrows():
            if row['Type'] == 'Object' and 'TypedDict' in row['Entity']:
                entity_name, _ = row['Entity'].split(':')
                attributes = {}
                for attribute in row['Attributes'].split(','):
                    key, value = map(str.strip, attribute.split(':'))
                    # Evaluate the type within a restricted environment
                    attributes[key] = eval(value, {"__builtins__": None}, {'list': list, 'dict': dict, 'str': str, 'int': int, 'bool': bool, 'float': float})

                # Dynamically create a TypedDict with these attributes
                typed_entity = create_typeddict(entity_name, attributes)
                typed_entities[entity_name] = typed_entity
        print(typed_entity.__annotations__)
        return typed_entity #test was entities


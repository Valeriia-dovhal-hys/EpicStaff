import base64
import pickle


def obj_to_txt(obj):
    message_bytes = pickle.dumps(obj)
    base64_bytes = base64.b64encode(message_bytes)
    txt = base64_bytes.decode("utf-8")
    return txt


def txt_to_obj(txt):
    base64_bytes = txt.encode("utf-8")
    message_bytes = base64.b64decode(base64_bytes)
    obj = pickle.loads(message_bytes)
    return obj


import textwrap

def shorten_string(s, width=50, placeholder="..."):
    return textwrap.shorten(s, width=width, placeholder=placeholder)

def shorten_dict(d, width=50, placeholder="..."):
    return {k: textwrap.shorten(v, width=width, placeholder=placeholder) if isinstance(v, str) and len(v) > width else v
            for k, v in d.items()}

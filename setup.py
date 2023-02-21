# -*- coding: utf-8 -*-

from __future__ import print_function
from setuptools import setup
from os import path
import re


def find_version():
    here = path.abspath(path.dirname(__file__))
    absfn = path.join(here, 'appmode/__init__.py')
    content = open(absfn).read()
    match = re.search(r"\n__version__ = ['\"]([^'\"]+)['\"]", content)
    return match.group(1)


setup(
    name='appmode',
    license='MIT',
    version = find_version(),
    author = 'Ole Schuett',
    author_email = 'ole.schuett@cp2k.org',
    url='http://github.com/oschuett/appmode',
    description='A Jupyter extensions that turns notebooks into web applications.',

    packages=["appmode"],
    include_package_data = True,
    install_requires=['notebook>=5'],
    python_requires='>=3.5',
    data_files=[('share/jupyter/nbextensions/appmode', [
                    'appmode/static/main.js',
                    'appmode/static/gears.svg'
    ])],

    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],

)

print("\nPlease run the following commands to enable appmode:")
print("  jupyter serverextension enable --py --sys-prefix appmode")
print("  jupyter nbextension     enable --py --sys-prefix appmode")

#EOF

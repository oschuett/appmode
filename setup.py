# -*- coding: utf-8 -*-

from __future__ import print_function
from setuptools import setup

setup(
    name='appmode',
    license='MIT',
    version='0.0.1',
    author = 'Ole Schuett',
    author_email = 'ole.schuett@empa.ch',
    url='http://github.com/oschuett/appmode',
    description='A Jupyter extensions that turns notebooks into web applications.',

    packages=["appmode"],
    install_requires=['notebook==5'],
    data_files=[('share/jupyter/nbextensions/appmode', [
                    'appmode/static/main.js',
                    'appmode/static/gears.svg'
    ])],

    classifiers=[
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],

)

print("Run the following commands to enable appmode:")
print("$ jupyter serverextension enable --py appmode")
print("$ jupyter nbextension     enable --py appmode")

#EOF
